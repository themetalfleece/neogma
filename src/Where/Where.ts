import { neo4jDriver } from '..';
import { BindParam } from '../BindParam/BindParam';
import { NeogmaConstraintError } from '../Errors';
import { Literal } from '../Literal';
import { Neo4jSupportedTypes } from '../QueryRunner/QueryRunner.types';
import {
  isOperator,
  Op,
  operators,
  WhereParamsByIdentifierI,
  WhereParamsI,
  WhereValuesI,
} from './Where.types';

/** a Where instance or the basic object which can create a Where instance */
export type AnyWhereI = WhereParamsByIdentifierI | Where;

const isNeo4jSupportedTypes = (
  value: WhereValuesI | undefined,
): value is Neo4jSupportedTypes => {
  if (value === undefined) {
    return false;
  }

  const isSupportedSingleType = (value: WhereValuesI): boolean => {
    return (
      value instanceof Literal ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      neo4jDriver.isInt(value) ||
      neo4jDriver.isPoint(value) ||
      neo4jDriver.isDate(value) ||
      neo4jDriver.isTime(value) ||
      neo4jDriver.isLocalTime(value) ||
      neo4jDriver.isDateTime(value) ||
      neo4jDriver.isLocalDateTime(value) ||
      neo4jDriver.isDuration(value)
    );
  };

  if (Array.isArray(value)) {
    return value.every((element) => isSupportedSingleType(element));
  }

  return isSupportedSingleType(value);
};

export class Where {
  /** where bind params. Ensures that keys of the bind param are unique */
  private bindParam: BindParam;
  /** all the given options, so we can easily combine them into a new statement */
  private rawParams: WhereParamsByIdentifierI[] = [];
  /**
   * Maps each `identifier.property` to its bind parameter name and operator.
   *
   * This mapping is necessary for:
   * 1. Generating the WHERE statement using these values
   * 2. Differentiating bind parameter names created by this Where instance
   *    from those in the BindParam, since this Where can only remove parameters it created
   */
  private identifierPropertyData: Array<{
    identifier: string;
    property: string;
    bindParamName: string | Literal;
    operator: (typeof operators)[number];
  }> = [];

  constructor(
    /** the where parameters to use */
    whereParams: Parameters<Where['addParams']>[0],
    /** an existing bind param to be used, so the properties can be merged. If empty, a new one will be created and used */
    bindParam?: BindParam,
  ) {
    this.bindParam = BindParam.acquire(bindParam);
    this.addParams(whereParams);

    Object.setPrototypeOf(this, Where.prototype);
  }

  /**
   * Returns the BindParam instance used by this Where clause.
   * The BindParam contains all the parameterized values for the WHERE conditions.
   *
   * @returns The BindParam instance containing query parameters
   */
  public getBindParam(): BindParam {
    return this.bindParam;
  }

  /**
   * Returns the raw where parameters array used to generate the final WHERE clause.
   * Each entry represents a set of where conditions that were added to this instance.
   *
   * @returns Array of where parameter objects, in the order they were added
   */
  public getRawParams(): Where['rawParams'] {
    return this.rawParams;
  }

  /** refreshes the statement and the bindParams by the given where params */
  public addParams(
    /** the where parameters to use */
    whereParams: WhereParamsByIdentifierI,
  ): Where {
    // push the latest whereParams to the end of the array
    this.rawParams.push(whereParams);

    /* set the identifierPropertyData field by the rawParams */

    // merge all rawParams, for each identifier, into a single one. That way, the latest rawOption will dictate its properties if some previous ones have a common key
    const params: WhereParamsByIdentifierI = {};
    for (const rawParam of this.rawParams) {
      for (const [identifier, value] of Object.entries(rawParam)) {
        params[identifier] = { ...params[identifier], ...value };
      }
    }

    // remove all used bind param names from the bind param, since we're gonna set them again from scratch
    this.bindParam.remove(
      this.identifierPropertyData
        .map(({ bindParamName }) => bindParamName)
        .filter((v) => typeof v === 'string') as string[],
    );
    // reset identifierPropertyData as they've been removed from the bindParam
    this.identifierPropertyData = [];

    for (const nodeIdentifier in params) {
      for (const property in params[nodeIdentifier]) {
        const value = params[nodeIdentifier][property];

        if (isNeo4jSupportedTypes(value)) {
          this.addBindParamDataEntry({
            identifier: nodeIdentifier,
            property,
            value,
            operator: 'eq',
          });
        } else if (value !== null && typeof value === 'object') {
          const symbols = Object.getOwnPropertySymbols(value);
          for (const { description } of symbols) {
            const operator = description as (typeof operators)[number];
            if (operator && isOperator[operator]?.(value)) {
              this.addBindParamDataEntry({
                identifier: nodeIdentifier,
                property,
                value: value[Op[operator]],
                operator,
              });
            }
          }
        }
      }
    }

    return this;
  }

  /** adds a value to the bind param, while updating the usedBindParamNames field appropriately */
  private addBindParamDataEntry = ({
    identifier,
    property,
    operator,
    value,
  }: {
    identifier: string;
    property: string;
    operator: Where['identifierPropertyData'][0]['operator'];
    value: Neo4jSupportedTypes;
  }) => {
    const bindParamName = this.bindParam.getUniqueNameAndAddWithLiteral(
      property,
      value,
    );
    this.identifierPropertyData.push({
      identifier,
      property,
      bindParamName,
      operator,
    });
  };

  /** gets the statement by the params */
  public getStatement = (
    /**
     * text is in the format "a.p1 = $v1 AND a.p2 = $v2"
     * object is in the format "{ a.p1 = $v1, a.p2 = $v2 }"
     */
    mode: 'object' | 'text',
  ): string => {
    const statementParts: string[] = [];

    const operatorForStatement = (
      operator: Where['identifierPropertyData'][0]['operator'],
    ) => {
      if (mode === 'object') {
        if (operator !== 'eq') {
          throw new NeogmaConstraintError(
            'The only operator which is supported for object mode is "eq"',
            {
              actual: {
                mode,
                operator,
              },
            },
          );
        }

        // : is the only operator used in object mode
        return ':';
      }

      const textMap: Record<
        Where['identifierPropertyData'][0]['operator'],
        string
      > = {
        eq: '=',
        in: 'IN',
        _in: 'IN',
        contains: 'CONTAINS',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        ne: '<>',
      };

      // else, return the appropriate text-mode operator
      return textMap[operator];
    };

    /**
     * if false, it will be in the format: property operator param
     * if true, it will be in the format: param operator property
     */
    const isReverseOperator = (
      operator: Where['identifierPropertyData'][0]['operator'],
    ) => {
      if (operator === '_in') {
        return true;
      }

      return false;
    };

    if (mode === 'text') {
      for (const bindParamData of this.identifierPropertyData) {
        const { bindParamName } = bindParamData;
        const name =
          bindParamName instanceof Literal
            ? bindParamName.getValue()
            : `$${bindParamName}`;

        if (isReverseOperator(bindParamData.operator)) {
          statementParts.push(
            [
              name,
              operatorForStatement(bindParamData.operator),
              `${bindParamData.identifier}.${bindParamData.property}`,
            ].join(' '),
          );
        } else {
          statementParts.push(
            [
              `${bindParamData.identifier}.${bindParamData.property}`,
              operatorForStatement(bindParamData.operator),
              name,
            ].join(' '),
          );
        }
      }

      return statementParts.join(' AND ');
    }

    if (mode === 'object') {
      for (const bindParamData of this.identifierPropertyData) {
        const { bindParamName } = bindParamData;
        const name =
          bindParamName instanceof Literal
            ? bindParamName.getValue()
            : `$${bindParamName}`;
        statementParts.push(
          [
            bindParamData.property,
            operatorForStatement(bindParamData.operator),
            ` ${name}`,
          ].join(''),
        );
      }

      return `{ ${statementParts.join(', ')} }`;
    }

    throw new NeogmaConstraintError(`invalid mode ${mode}`);
  };

  /** returns a Where object if params is specified, else returns null */
  public static acquire(
    params?: AnyWhereI | null,
    bindParam?: BindParam,
  ): Where | null {
    if (!params) {
      return null;
    }

    if (params instanceof Where) {
      return params;
    }

    return new Where(params, bindParam);
  }

  /**
   * if the value is not an array, it gets returned as is. If it's an array, a "[Op.in]" object is returned for that value
   */
  public static ensureIn(value: WhereValuesI): WhereValuesI {
    return value instanceof Array
      ? {
          [Op.in]: value,
        }
      : value;
  }

  /**
   * Splits where parameters into eq-only and non-eq operator groups.
   * Eq-only params can use Neo4j's bracket syntax `{ prop: $val }`,
   * while non-eq params require a WHERE clause `WHERE n.prop > $val`.
   *
   * @param params - The where parameters to split
   * @returns Object with eqParams (for bracket syntax) and nonEqParams (for WHERE clause)
   *
   * @example
   * ```typescript
   * const { eqParams, nonEqParams } = Where.splitByOperator({
   *   name: 'John',           // goes to eqParams
   *   age: { [Op.gte]: 18 },  // goes to nonEqParams
   * });
   * ```
   */
  public static splitByOperator(params: WhereParamsI): {
    eqParams: WhereParamsI;
    nonEqParams: WhereParamsI;
  } {
    const eqParams: WhereParamsI = {};
    const nonEqParams: WhereParamsI = {};

    for (const property in params) {
      const value = params[property];

      // Check if value is a direct Neo4j supported type (implicit eq)
      if (isNeo4jSupportedTypes(value)) {
        eqParams[property] = value;
        continue;
      }

      // Check if value is an operator object
      if (value !== null && typeof value === 'object') {
        const symbols = Object.getOwnPropertySymbols(value);
        let hasNonEqOperator = false;
        let hasEqOperator = false;

        for (const symbol of symbols) {
          const operator = symbol.description as (typeof operators)[number];
          if (operator && isOperator[operator]?.(value)) {
            if (operator === 'eq') {
              hasEqOperator = true;
            } else {
              hasNonEqOperator = true;
            }
          }
        }

        // If has any non-eq operators, put entire property in nonEqParams
        // This handles cases like { [Op.gte]: 18, [Op.lte]: 65 } or { [Op.eq]: 'a', [Op.ne]: 'b' }
        if (hasNonEqOperator) {
          nonEqParams[property] = value;
        } else if (hasEqOperator) {
          // Only eq operator - can use bracket syntax
          eqParams[property] = value;
        }
      }
    }

    return { eqParams, nonEqParams };
  }
}
