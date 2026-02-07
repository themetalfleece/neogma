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
import { getOnCreateSetString } from './getOnCreateSetString';
import { getOnMatchSetString } from './getOnMatchSetString';
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
  CallI,
  CreateI,
  DeleteI,
  ForEachI,
  LimitI,
  MatchI,
  MergeI,
  OnCreateSetI,
  OnMatchSetI,
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
  isCallParameter,
  isCreateParameter,
  isDeleteParameter,
  isForEachParameter,
  isLimitParameter,
  isMatchParameter,
  isMergeParameter,
  isOnCreateSetParameter,
  isOnMatchSetParameter,
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
  OnCreateSetI: OnCreateSetI['onCreateSet'];
  OnMatchSetI: OnMatchSetI['onMatchSet'];
  CallI: CallI['call'];
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
      } else if (isOnCreateSetParameter(param)) {
        statementParts.push(getOnCreateSetString(param.onCreateSet, deps));
      } else if (isOnMatchSetParameter(param)) {
        statementParts.push(getOnMatchSetString(param.onMatchSet, deps));
      } else if (isCallParameter(param)) {
        statementParts.push(`CALL {\n${param.call}\n}`);
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

  /**
   * RAW statement
   * A literal statement to use as is without any processing.
   *
   * **SECURITY WARNING**: This method does not sanitize or parameterize input.
   * Never pass user-provided input directly to this method, as it can lead to
   * Cypher injection attacks. Only use with trusted, hardcoded strings or
   * values that have been validated and sanitized by your application.
   *
   * @example
   * // SAFE: Using hardcoded string
   * new QueryBuilder()
   *   .raw('MATCH (n:Person) RETURN n')
   *   .run();
   *
   * @example
   * // UNSAFE: Never do this with user input!
   * // const userInput = req.body.query;
   * // new QueryBuilder().raw(userInput).run(); // VULNERABLE TO INJECTION
   */
  public raw(raw: RawI['raw']): QueryBuilder {
    return this.addParams({ raw });
  }
  /**
   * MATCH statement
   * Matches patterns in the graph database.
   *
   * @example
   * // Match by literal string
   * new QueryBuilder().match('(n:Person)').return('n');
   *
   * @example
   * // Match by object
   * new QueryBuilder()
   *   .match({ identifier: 'n', label: 'Person', where: { name: 'John' } })
   *   .return('n');
   */
  public match(match: MatchI['match']): QueryBuilder {
    return this.addParams({ match });
  }
  /**
   * CREATE statement
   * Creates nodes and relationships in the graph database.
   *
   * @example
   * // Create by literal string
   * new QueryBuilder().create('(n:Person { name: "John" })').return('n');
   *
   * @example
   * // Create by object
   * new QueryBuilder()
   *   .create({ identifier: 'n', label: 'Person', properties: { name: 'John' } })
   *   .return('n');
   */
  public create(create: CreateI['create']): QueryBuilder {
    return this.addParams({ create });
  }
  /**
   * MERGE statement
   * Matches existing patterns or creates new ones if they don't exist.
   *
   * @example
   * // Merge by literal string
   * new QueryBuilder().merge('(n:Person { name: "John" })').return('n');
   *
   * @example
   * // Merge by object
   * new QueryBuilder()
   *   .merge({ identifier: 'n', label: 'Person', properties: { name: 'John' } })
   *   .return('n');
   */
  public merge(merge: MergeI['merge']): QueryBuilder {
    return this.addParams({ merge });
  }
  /**
   * SET statement
   * Sets properties on nodes or relationships.
   *
   * @example
   * // Set by literal string
   * new QueryBuilder().match('(n:Person)').set('n.age = 30').return('n');
   *
   * @example
   * // Set by object
   * new QueryBuilder()
   *   .match({ identifier: 'n', label: 'Person' })
   *   .set({ identifier: 'n', properties: { age: 30 } })
   *   .return('n');
   */
  public set(set: SetI['set']): QueryBuilder {
    return this.addParams({ set });
  }
  /**
   * DELETE statement
   * Deletes nodes and relationships from the graph database.
   *
   * @example
   * // Delete by literal string
   * new QueryBuilder().match('(n:Person)').delete('n');
   *
   * @example
   * // Detach delete by object
   * new QueryBuilder()
   *   .match({ identifier: 'n', label: 'Person' })
   *   .delete({ identifiers: ['n'], detach: true });
   */
  public delete(deleteParam: DeleteI['delete']): QueryBuilder {
    return this.addParams({ delete: deleteParam });
  }
  /**
   * REMOVE statement
   * Removes properties or labels from nodes.
   *
   * @example
   * // Remove by literal string
   * new QueryBuilder().match('(n:Person)').remove('n.age').return('n');
   *
   * @example
   * // Remove properties by object
   * new QueryBuilder()
   *   .match({ identifier: 'n', label: 'Person' })
   *   .remove({ identifier: 'n', properties: ['age', 'status'] })
   *   .return('n');
   */
  public remove(remove: RemoveI['remove']): QueryBuilder {
    return this.addParams({ remove });
  }
  /**
   * RETURN statement
   * Specifies what to return from the query.
   *
   * @example
   * // Return by literal string
   * new QueryBuilder().match('(n:Person)').return('n.name, n.age');
   *
   * @example
   * // Return by array
   * new QueryBuilder().match('(n:Person)').return(['n.name', 'n.age']);
   */
  public return(returnParam: ReturnI['return']): QueryBuilder {
    return this.addParams({ return: returnParam });
  }
  /**
   * LIMIT statement
   * Limits the number of results returned.
   *
   * @example
   * // Limit by number (uses bind param)
   * new QueryBuilder().match('(n:Person)').return('n').limit(10);
   *
   * @example
   * // Limit by literal string
   * new QueryBuilder().match('(n:Person)').return('n').limit('toInteger(rand() * 10)');
   */
  public limit(limit: LimitI['limit']): QueryBuilder {
    return this.addParams({ limit });
  }
  /**
   * WITH statement
   * Passes results from one part of the query to the next.
   *
   * @example
   * // With by literal string
   * new QueryBuilder().match('(n:Person)').with('n, count(*) as total').return('total');
   *
   * @example
   * // With by array
   * new QueryBuilder().match('(n:Person)').with(['n', 'count(*) as total']).return('total');
   */
  public with(withParam: WithI['with']): QueryBuilder {
    return this.addParams({ with: withParam });
  }
  /**
   * ORDER BY statement
   * Orders the results by specified properties.
   *
   * @example
   * // Order by literal string
   * new QueryBuilder().match('(n:Person)').return('n').orderBy('n.name ASC');
   *
   * @example
   * // Order by object
   * new QueryBuilder()
   *   .match('(n:Person)')
   *   .return('n')
   *   .orderBy({ identifier: 'n', property: 'name', direction: 'DESC' });
   */
  public orderBy(orderBy: OrderByI['orderBy']): QueryBuilder {
    return this.addParams({ orderBy });
  }
  /**
   * UNWIND statement
   * Expands a list into individual rows.
   *
   * @example
   * // Unwind by literal string
   * new QueryBuilder().unwind('[1, 2, 3] as x').return('x');
   *
   * @example
   * // Unwind by object
   * new QueryBuilder().unwind({ value: '$list', as: 'item' }).return('item');
   */
  public unwind(unwind: UnwindI['unwind']): QueryBuilder {
    return this.addParams({ unwind });
  }
  /**
   * FOREACH statement
   * Iterates over a list and performs update operations.
   *
   * @example
   * new QueryBuilder()
   *   .match('(n:Person)')
   *   .forEach('(x IN n.emails | CREATE (:Email { address: x }))');
   */
  public forEach(forEach: ForEachI['forEach']): QueryBuilder {
    return this.addParams({ forEach });
  }
  /**
   * SKIP statement
   * Skips the specified number of results.
   *
   * @example
   * // Skip by number (uses bind param)
   * new QueryBuilder().match('(n:Person)').return('n').skip(5).limit(10);
   *
   * @example
   * // Skip by literal string
   * new QueryBuilder().match('(n:Person)').return('n').skip('toInteger(rand() * 10)');
   */
  public skip(skip: SkipI['skip']): QueryBuilder {
    return this.addParams({ skip });
  }
  /**
   * WHERE statement
   * Filters results based on conditions.
   *
   * @example
   * // Where by literal string
   * new QueryBuilder().match('(n:Person)').where('n.age > 18').return('n');
   *
   * @example
   * // Where by object
   * new QueryBuilder()
   *   .match('(n:Person)')
   *   .where({ n: { age: { [Op.gt]: 18 } } })
   *   .return('n');
   */
  public where(where: WhereI['where']): QueryBuilder {
    return this.addParams({ where });
  }
  /**
   * ON CREATE SET statement
   * Used with MERGE to specify properties to set when a new node is created.
   *
   * @example
   * // Using with MERGE to set properties on create
   * new QueryBuilder()
   *   .merge({ identifier: 'n', label: 'Person', properties: { name: 'John' } })
   *   .onCreateSet({ identifier: 'n', properties: { created: new Date().toISOString() } })
   *   .return('n');
   */
  public onCreateSet(onCreateSet: OnCreateSetI['onCreateSet']): QueryBuilder {
    return this.addParams({ onCreateSet });
  }
  /**
   * ON MATCH SET statement
   * Used with MERGE to specify properties to set when an existing node is matched.
   *
   * @example
   * // Using with MERGE to set properties on match
   * new QueryBuilder()
   *   .merge({ identifier: 'n', label: 'Person', properties: { name: 'John' } })
   *   .onMatchSet({ identifier: 'n', properties: { lastSeen: new Date().toISOString() } })
   *   .return('n');
   */
  public onMatchSet(onMatchSet: OnMatchSetI['onMatchSet']): QueryBuilder {
    return this.addParams({ onMatchSet });
  }
  /**
   * CALL subquery statement
   * Wraps the content in a CALL { ... } block.
   *
   * **SECURITY WARNING**: When passing a string, the content is inserted directly
   * into the query without sanitization. Never pass user-provided input directly.
   * Use `BindParam` for parameterized values and validated/escaped identifiers.
   * Prefer using `QueryBuilder` instances which provide safer parameter binding.
   *
   * @example
   * // Call with a literal subquery string (use with caution - no sanitization)
   * new QueryBuilder()
   *   .match('(n:Person)')
   *   .call('WITH n MATCH (n)-[:KNOWS]->(friend) RETURN count(friend) as friendCount')
   *   .return('n, friendCount');
   *
   * @example
   * // Call with another QueryBuilder (recommended - safer parameter binding)
   * const subquery = new QueryBuilder()
   *   .with('n')
   *   .match({ related: [{ identifier: 'n' }, { direction: 'out', name: 'KNOWS' }, { identifier: 'friend' }] })
   *   .return('count(friend) as friendCount');
   * new QueryBuilder()
   *   .match('(n:Person)')
   *   .call(subquery)
   *   .return('n, friendCount');
   */
  public call(call: CallI['call'] | QueryBuilder): QueryBuilder {
    // Validate that subquery QueryBuilder shares the same BindParam as the parent.
    // Otherwise, parameters auto-bound in the subquery will not be present
    // in the parent's BindParam, causing runtime failures.
    if (
      call instanceof QueryBuilder &&
      call.getBindParam() !== this.bindParam
    ) {
      throw new NeogmaError(
        'Subquery passed to QueryBuilder.call must use the same BindParam instance as the parent QueryBuilder. ' +
          'Create the subquery with `new QueryBuilder(parentBuilder.getBindParam())` to share bind parameters.',
      );
    }
    const callStatement =
      call instanceof QueryBuilder ? call.getStatement() : call;
    return this.addParams({ call: callStatement });
  }
}
