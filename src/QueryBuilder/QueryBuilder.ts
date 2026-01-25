import type { QueryResult } from 'neo4j-driver';

import { BindParam } from '../BindParam';
import { NeogmaError } from '../Errors';
import type { Runnable } from '../QueryRunner';
import { QueryRunner } from '../QueryRunner';
import { getRunnable } from '../Sessions';
import { trimWhitespace } from '../utils/string';
import { getCreateOrMergeString } from './getCreateOrMergeString';
import { getDeleteString } from './getDeleteString';
import { getForEachString } from './getForEachString';
import { getIdentifierWithLabel } from './getIdentifierWithLabel';
import { getLimitString } from './getLimitString';
import { getMatchString } from './getMatchString';
import { getNodeStatement } from './getNodeStatement';
import { getNormalizedLabels } from './getNormalizedLabels';
import { getOrderByString } from './getOrderByString';
import { getPropertiesWithParams } from './getPropertiesWithParams';
import { getRelationshipStatement } from './getRelationshipStatement';
import { getRemoveString } from './getRemoveString';
import { getReturnString } from './getReturnString';
import { getSetParts } from './getSetParts';
import { getSetString } from './getSetString';
import { getSkipString } from './getSkipString';
import { getUnwindString } from './getUnwindString';
import { getVariableLengthRelationshipString } from './getVariableLengthRelationshipString';
import { getWhereString } from './getWhereString';
import { getWithString } from './getWithString';
import type {
  CreateI,
  DeleteI,
  ForEachI,
  LimitI,
  MatchI,
  MergeI,
  OrderByI,
  ParameterI,
  RawI,
  RemoveI,
  ReturnI,
  SetI,
  SkipI,
  UnwindI,
  WhereI,
  WithI,
} from './QueryBuilder.types';
import {
  isCreateParameter,
  isDeleteParameter,
  isForEachParameter,
  isLimitParameter,
  isMatchParameter,
  isMergeParameter,
  isOrderByParameter,
  isRawParameter,
  isRemoveParameter,
  isReturnParameter,
  isSetParameter,
  isSkipParameter,
  isUnwindParameter,
  isWhereParameter,
  isWithParameter,
} from './QueryBuilder.types';

export type QueryBuilderParameters = {
  ParameterI: ParameterI;
  RawI: RawI['raw'];
  MatchI: MatchI['match'];
  CreateI: CreateI['create'];
  MergeI: MergeI['merge'];
  SetI: SetI['set'];
  DeleteI: DeleteI['delete'];
  RemoveI: RemoveI['remove'];
  ReturnI: ReturnI['return'];
  LimitI: LimitI['limit'];
  WithI: WithI['with'];
  OrderByI: OrderByI['orderBy'];
  UnwindI: UnwindI['unwind'];
  ForEachI: ForEachI['forEach'];
  SkipI: SkipI['skip'];
  WhereI: WhereI['where'];
};

export class QueryBuilder {
  /** a queryRunner instance can be set to always be used at the 'run' method */
  public static queryRunner: QueryRunner;

  /** parameters for the query to be generated */
  private parameters: ParameterI[] = [];
  /** the statement for the query */
  private statement = '';
  /** the bind parameters for the query */
  private bindParam: BindParam;

  constructor(
    /** an existing bindParam to be used */
    bindParam?: BindParam,
  ) {
    this.bindParam = BindParam.acquire(bindParam);
  }

  public addParams(
    /** parameters for the query */
    parameters: ParameterI | ParameterI[],
    ...restParameters: ParameterI[]
  ): QueryBuilder {
    const allParameters = Array.isArray(parameters) ? parameters : [parameters];

    if (restParameters) {
      allParameters.push(...restParameters);
    }

    this.parameters.push(...allParameters);
    this.setStatementByParameters(allParameters);

    return this;
  }

  /** get the generated statement for the query */
  public getStatement(): string {
    return this.statement;
  }

  /** get the bind parameter for the query */
  public getBindParam(): BindParam {
    return this.bindParam;
  }

  /** generates the statement by using the parameters and the bindParam */
  private setStatementByParameters(parameters: QueryBuilder['parameters']) {
    const statementParts: string[] = [];

    const deps = {
      bindParam: this.bindParam,
      getBindParam: () => this.getBindParam(),
    };

    for (const param of parameters) {
      if (param === null || param === undefined) {
        continue;
      }

      if (isRawParameter(param)) {
        statementParts.push(param.raw);
      } else if (isMatchParameter(param)) {
        statementParts.push(getMatchString(param.match, deps));
      } else if (isCreateParameter(param)) {
        statementParts.push(
          getCreateOrMergeString(param.create, 'create', deps),
        );
      } else if (isMergeParameter(param)) {
        statementParts.push(getCreateOrMergeString(param.merge, 'merge', deps));
      } else if (isSetParameter(param)) {
        statementParts.push(getSetString(param.set, deps));
      } else if (isDeleteParameter(param)) {
        statementParts.push(getDeleteString(param.delete));
      } else if (isRemoveParameter(param)) {
        statementParts.push(getRemoveString(param.remove));
      } else if (isReturnParameter(param)) {
        statementParts.push(getReturnString(param.return));
      } else if (isLimitParameter(param)) {
        statementParts.push(getLimitString(param.limit, deps));
      } else if (isWithParameter(param)) {
        statementParts.push(getWithString(param.with));
      } else if (isSkipParameter(param)) {
        statementParts.push(getSkipString(param.skip, deps));
      } else if (isUnwindParameter(param)) {
        statementParts.push(getUnwindString(param.unwind));
      } else if (isForEachParameter(param)) {
        statementParts.push(getForEachString(param.forEach));
      } else if (isOrderByParameter(param)) {
        statementParts.push(getOrderByString(param.orderBy));
      } else if (isWhereParameter(param)) {
        statementParts.push(getWhereString(param.where, deps));
      }
    }

    // join the statement parts and trim all whitespace. Append them to the existing statement
    this.statement = trimWhitespace(
      this.statement + ' ' + statementParts.join('\n'),
    );
  }

  /**
   * Surrounds the label with backticks to also allow spaces
   * @param label - the label to use
   * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
   */
  public static getNormalizedLabels = getNormalizedLabels;

  /**
   * Returns a string to be used in a query, regardless if any of the identifier or label are null
   */
  public static getIdentifierWithLabel = getIdentifierWithLabel;

  /**
   * Returns the appropriate string for a node, ready to be put in a statement
   * Example: (ident: Label { a.p1: $v1 })
   */
  public static getNodeStatement = getNodeStatement;

  /**
   * Returns the appropriate string for a relationship, ready to be put in a statement
   * Example: -[identifier:name*minHops..maxHops {where}]->
   */
  public static getRelationshipStatement = getRelationshipStatement;

  /**
   * Returns the inner part of a relationship given the min and max hops. It doesn't include the brackets ([])
   * Example: minHops = 1, maxHops = 2 -> "*1..2"
   *
   * https://neo4j.com/docs/cypher-manual/current/patterns/reference/#variable-length-relationships-rules
   */
  public static getVariableLengthRelationshipString =
    getVariableLengthRelationshipString;

  /** Returns the parts and the statement for a SET operation with the given params */
  public static getSetParts = getSetParts;

  /**
   * Returns an object with replacing its values with a bind param value.
   * If value is a literal, returns literal name as value
   * Example return value: { a.p1 = $v1, b.p2 = $v2, c.p3 = literalP3 }
   */
  public static getPropertiesWithParams = getPropertiesWithParams;

  /** runs this instance with the given QueryRunner instance */
  public async run(
    /** the QueryRunner instance to use */
    queryRunnerOrRunnable?: QueryRunner | Runnable | null,
    /** an existing session to use. Set it only if the first param is a QueryRunner instance */
    existingSession?: Runnable | null,
  ): Promise<QueryResult> {
    const queryRunner =
      queryRunnerOrRunnable instanceof QueryRunner
        ? queryRunnerOrRunnable
        : QueryBuilder.queryRunner;
    if (!queryRunner) {
      throw new NeogmaError(
        'A queryRunner was not given to run this builder. Make sure that the first parameter is a QueryRunner instance, or that QueryBuilder.queryRunner is set',
      );
    }

    const sessionToGet =
      queryRunnerOrRunnable && !(queryRunnerOrRunnable instanceof QueryRunner)
        ? queryRunnerOrRunnable
        : existingSession;

    return getRunnable(
      sessionToGet,
      async (session) => {
        return queryRunner.run(
          this.getStatement(),
          this.getBindParam().get(),
          session,
        );
      },
      queryRunner.getDriver(),
      queryRunner.sessionParams,
    );
  }

  /** a literal statement to use as is */
  public raw(raw: RawI['raw']): QueryBuilder {
    return this.addParams({ raw });
  }
  /** MATCH statement */
  public match(match: MatchI['match']): QueryBuilder {
    return this.addParams({ match });
  }
  /** CREATE statement */
  public create(create: CreateI['create']): QueryBuilder {
    return this.addParams({ create });
  }
  /** MERGE statement */
  public merge(merge: MergeI['merge']): QueryBuilder {
    return this.addParams({ merge });
  }
  /** SET statement */
  public set(set: SetI['set']): QueryBuilder {
    return this.addParams({ set });
  }
  /** DELETE statement */
  public delete(deleteParam: DeleteI['delete']): QueryBuilder {
    return this.addParams({ delete: deleteParam });
  }
  /** REMOVE statement */
  public remove(remove: RemoveI['remove']): QueryBuilder {
    return this.addParams({ remove });
  }
  /** RETURN statement */
  public return(returnParam: ReturnI['return']): QueryBuilder {
    return this.addParams({ return: returnParam });
  }
  /** LIMIT statement */
  public limit(limit: LimitI['limit']): QueryBuilder {
    return this.addParams({ limit });
  }
  /** WITH statement */
  public with(withParam: WithI['with']): QueryBuilder {
    return this.addParams({ with: withParam });
  }
  /** ORDER BY statement */
  public orderBy(orderBy: OrderByI['orderBy']): QueryBuilder {
    return this.addParams({ orderBy });
  }
  /** UNWIND statement */
  public unwind(unwind: UnwindI['unwind']): QueryBuilder {
    return this.addParams({ unwind });
  }
  /** FOR EACH statement */
  public forEach(forEach: ForEachI['forEach']): QueryBuilder {
    return this.addParams({ forEach });
  }
  /** SKIP statement */
  public skip(skip: SkipI['skip']): QueryBuilder {
    return this.addParams({ skip });
  }
  /** WHERE statement */
  public where(where: WhereI['where']): QueryBuilder {
    return this.addParams({ where });
  }
}
