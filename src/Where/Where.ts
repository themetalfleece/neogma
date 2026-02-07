import { neo4jDriver } from '..';
import { BindParam } from '../BindParam/BindParam';
import { NeogmaConstraintError, NeogmaError } from '../Errors';
import { Literal } from '../Literal';
import type {
  BindableWhereValue,
  Neo4jSupportedTypes,
} from '../QueryRunner/QueryRunner.types';
import { escapeIfNeeded, isValidCypherIdentifier } from '../utils/cypher';
import type {
  operators,
  WhereParamsByIdentifierI,
  WhereParamsI,
  WhereValuesI,
} from './Where.types';
import { isOperator, Op } from './Where.types';

/** a Where instance or the basic object which can create a Where instance */
export type AnyWhereI = WhereParamsByIdentifierI | Where;

/**
 * Type guard to check if a where value is a direct Neo4j supported type (not an operator).
 * Direct values are treated as implicit equality checks.
 */
const isNeo4jSupportedTypes = (
  value: WhereValuesI | undefined,
): value is Neo4jSupportedTypes | Literal => {
  if (value === undefined) {
    return false;
  }

  const isSupportedSingleType = (v: WhereValuesI): boolean => {
    return (
      v instanceof Literal ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      neo4jDriver.isInt(v) ||
      neo4jDriver.isPoint(v) ||
      neo4jDriver.isDate(v) ||
      neo4jDriver.isTime(v) ||
      neo4jDriver.isLocalTime(v) ||
      neo4jDriver.isDateTime(v) ||
      neo4jDriver.isLocalDateTime(v) ||
      neo4jDriver.isDuration(v)
    );
  };

  if (Array.isArray(value)) {
    // For direct array values, check each element is a supported single type.
    // Note: Nested arrays (Neo4jSingleTypes[][]) come from Op.in extraction, not direct values.
    return value.every((el) => isSupportedSingleType(el));
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
   *
   * Note: `bindParamName` is null for operators that don't require a parameter (is, isNot with null).
   */
  private identifierPropertyData: Array<{
    identifier: string;
    property: string;
    bindParamName: string | Literal | null;
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
        this.processPropertyValue(nodeIdentifier, property, value);
      }
    }

    return this;
  }

  /**
   * Determines if an operator with its value represents a null check.
   * Returns the effective null-check operator ('is' or 'isNot'), or null if not a null check.
   *
   * Null check patterns:
   * - `Op.is` → 'is' (explicit IS NULL)
   * - `Op.isNot` → 'isNot' (explicit IS NOT NULL)
   * - `Op.eq` with null → 'is' (equality with null becomes IS NULL)
   * - `Op.ne` with null → 'isNot' (not-equal with null becomes IS NOT NULL)
   */
  private static resolveNullCheckOperator(
    operator: (typeof operators)[number],
    operatorValue: unknown,
  ): 'is' | 'isNot' | null {
    if (operator === 'is') return 'is';
    if (operator === 'isNot') return 'isNot';
    if (operatorValue === null) {
      if (operator === 'eq') return 'is';
      if (operator === 'ne') return 'isNot';
    }
    return null;
  }

  /**
   * Processes a single property value and adds it to identifierPropertyData.
   * Handles null checks, direct values, and operator objects.
   */
  private processPropertyValue = (
    identifier: string,
    property: string,
    value: WhereValuesI | undefined,
  ): void => {
    // Validate identifier is a safe Cypher identifier to prevent injection.
    // Identifiers must match declared variables in the query scope.
    // Note: Empty identifiers are allowed for internal use cases (e.g., anonymous nodes).
    if (identifier && !isValidCypherIdentifier(identifier)) {
      throw new NeogmaError(
        `Invalid identifier "${identifier}" in WHERE clause. ` +
          `Identifiers must contain only alphanumeric characters and underscores, and cannot start with a number.`,
      );
    }

    // Direct null value → IS NULL
    if (value === null) {
      this.addNullCheckEntry(identifier, property, 'is');
      return;
    }

    // Direct Neo4j value → equality check
    if (isNeo4jSupportedTypes(value)) {
      this.addBindParamDataEntry({
        identifier,
        property,
        value,
        operator: 'eq',
      });
      return;
    }

    // Object with operator symbols - process each operator individually
    // Note: null already handled above, undefined is falsy, so this handles operator objects
    if (value && typeof value === 'object') {
      for (const { description } of Object.getOwnPropertySymbols(value)) {
        const operator = description as (typeof operators)[number];
        if (!operator || !isOperator[operator]?.(value)) continue;

        const operatorValue = value[Op[operator]];
        const nullCheckOp = Where.resolveNullCheckOperator(
          operator,
          operatorValue,
        );

        if (nullCheckOp) {
          this.addNullCheckEntry(identifier, property, nullCheckOp);
        } else {
          this.addBindParamDataEntry({
            identifier,
            property,
            value: operatorValue,
            operator,
          });
        }
      }
    }
  };

  /** Adds a null-check entry (IS NULL or IS NOT NULL) without a bind param. */
  private addNullCheckEntry = (
    identifier: string,
    property: string,
    operator: 'is' | 'isNot',
  ): void => {
    this.identifierPropertyData.push({
      identifier,
      property,
      bindParamName: null,
      operator,
    });
  };

  /** Adds a value to the bind param, while updating the identifierPropertyData field. */
  private addBindParamDataEntry = ({
    identifier,
    property,
    operator,
    value,
  }: {
    identifier: string;
    property: string;
    operator: Where['identifierPropertyData'][0]['operator'];
    value: BindableWhereValue | Literal;
  }): void => {
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
            `The only operator which is supported for object mode is "eq". ` +
              `Operator "${operator}" requires text mode (WHERE clause).`,
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
        is: 'IS NULL',
        isNot: 'IS NOT NULL',
      };

      // else, return the appropriate text-mode operator
      return textMap[operator];
    };

    /**
     * Returns true if the operator doesn't require a bind parameter.
     * These operators are unary and only need the property reference.
     */
    const isNoParamOperator = (
      operator: Where['identifierPropertyData'][0]['operator'],
    ) => {
      return operator === 'is' || operator === 'isNot';
    };

    /**
     * if false, it will be in the format: property operator param
     * if true, it will be in the format: param operator property
     */
    const isReverseOperator = (
      operator: Where['identifierPropertyData'][0]['operator'],
    ): boolean => operator === '_in';

    if (mode === 'text') {
      for (const bindParamData of this.identifierPropertyData) {
        const { bindParamName } = bindParamData;
        const safeProperty = escapeIfNeeded(bindParamData.property);

        // Handle operators that don't need a parameter (is, isNot)
        if (isNoParamOperator(bindParamData.operator)) {
          statementParts.push(
            `${bindParamData.identifier}.${safeProperty} ${operatorForStatement(bindParamData.operator)}`,
          );
          continue;
        }

        const name =
          bindParamName instanceof Literal
            ? bindParamName.getValue()
            : `$${bindParamName}`;

        if (isReverseOperator(bindParamData.operator)) {
          statementParts.push(
            [
              name,
              operatorForStatement(bindParamData.operator),
              `${bindParamData.identifier}.${safeProperty}`,
            ].join(' '),
          );
        } else {
          statementParts.push(
            [
              `${bindParamData.identifier}.${safeProperty}`,
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
        const safeProperty = escapeIfNeeded(bindParamData.property);

        const name =
          bindParamName instanceof Literal
            ? bindParamName.getValue()
            : `$${bindParamName}`;
        statementParts.push(
          [
            safeProperty,
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

      // Direct null means IS NULL - goes to nonEqParams
      if (value === null) {
        nonEqParams[property] = value;
        continue;
      }

      // Check if value is an operator object
      if (typeof value === 'object') {
        let hasNonEqOperator = false;
        let hasEqWithValue = false;

        for (const { description } of Object.getOwnPropertySymbols(value)) {
          const operator = description as (typeof operators)[number];
          if (!operator || !isOperator[operator]?.(value)) continue;

          const operatorValue = value[Op[operator]];

          // Null checks and non-eq operators go to nonEqParams
          if (Where.resolveNullCheckOperator(operator, operatorValue)) {
            hasNonEqOperator = true;
          } else if (operator === 'eq') {
            hasEqWithValue = true;
          } else {
            hasNonEqOperator = true;
          }
        }

        // Non-eq operators (including null checks) require WHERE clause
        if (hasNonEqOperator) {
          nonEqParams[property] = value;
        } else if (hasEqWithValue) {
          eqParams[property] = value;
        }
      }
    }

    return { eqParams, nonEqParams };
  }
}
