import type { Driver, QueryResult, SessionConfig } from 'neo4j-driver';

import type { CreateParams } from './create';
import { create } from './create';
import { createRelationship } from './createRelationship';
import type { DeleteParams } from './delete';
import { deleteNodes } from './delete';
import type {
  CreateRelationshipParamsI,
  Runnable,
  UpdateSupportedProperties,
} from './QueryRunner.types';
import { run } from './run';
import {
  getNodesDeleted,
  getRelationshipsDeleted,
  getResultProperties,
} from './staticMethods';
import type { UpdateParams } from './update';
import { update } from './update';

type AnyObject = Record<string, any>;

/**
 * Executes Cypher queries against a Neo4j database.
 * Provides methods for running raw queries and common operations like create, update, and delete.
 *
 * @example
 * ```ts
 * const queryRunner = new QueryRunner({ driver, logger: console.log });
 * const result = await queryRunner.run('MATCH (n:User) RETURN n', {});
 * ```
 */
export class QueryRunner {
  private driver: Driver;
  public sessionParams?: SessionConfig;
  /** whether to log the statements and parameters with the given function */
  private logger:
    | null
    | ((...val: Array<string | boolean | AnyObject | number>) => any);
  /** maps a session object to a uuid, for logging purposes */
  private sessionIdentifiers = new WeakMap<Runnable, string>([]);

  /**
   * Creates a new QueryRunner instance.
   *
   * @param params - Configuration for the query runner
   * @param params.driver - The Neo4j driver instance
   * @param params.logger - Optional logging function for queries
   * @param params.sessionParams - Default session configuration for queries
   */
  constructor(params: {
    driver: QueryRunner['driver'];
    logger?: QueryRunner['logger'];
    sessionParams?: SessionConfig;
  }) {
    this.driver = params.driver;
    this.logger = params?.logger || null;
    this.sessionParams = params.sessionParams;
  }

  /**
   * Returns the Neo4j driver instance used by this QueryRunner.
   *
   * @returns The Neo4j driver instance
   */
  public getDriver(): Driver {
    return this.driver;
  }

  public create = async <T>(params: CreateParams<T>): Promise<QueryResult> => {
    return create(params, {
      run: (statement, parameters, session) =>
        this.run(statement, parameters, session),
      defaultIdentifier: QueryRunner.identifiers.default,
    });
  };

  public update = async <T extends UpdateSupportedProperties>(
    params: UpdateParams<T>,
  ): Promise<QueryResult> => {
    return update(params, {
      runQueryBuilder: (queryBuilder, session) =>
        queryBuilder.run(this, session),
      defaultIdentifier: QueryRunner.identifiers.default,
    });
  };

  public delete = async (params: DeleteParams): Promise<QueryResult> => {
    return deleteNodes(params, {
      runQueryBuilder: (queryBuilder, session) =>
        queryBuilder.run(this, session),
      defaultIdentifier: QueryRunner.identifiers.default,
    });
  };

  public createRelationship = async (
    params: CreateRelationshipParamsI,
  ): Promise<QueryResult> => {
    return createRelationship(params, {
      runQueryBuilder: (queryBuilder, session) =>
        queryBuilder.run(this, session),
      defaultIdentifiers: QueryRunner.identifiers.createRelationship,
    });
  };

  /** runs a statement */
  public run(
    /** the statement to run */
    statement: string,
    /** parameters for the query */
    parameters?: Record<string, any>,
    /** the session or transaction for running this query. Passing it will ignore the `sessionParams` passed to the constructor */
    existingSession?: Runnable | null,
  ): Promise<QueryResult> {
    return run(statement, parameters, existingSession, {
      driver: this.driver,
      sessionParams: this.sessionParams,
      logger: this.logger,
      sessionIdentifiers: this.sessionIdentifiers,
    });
  }

  /** default identifiers for the queries */
  public static readonly identifiers = {
    /** general purpose default identifier */
    default: 'nodes',
    /** default identifiers for createRelationship */
    createRelationship: {
      /** default identifier for the source node */
      source: 'source',
      /** default identifier for the target node */
      target: 'target',
      /** default identifier for the relationship */
      relationship: 'r',
    },
  };

  public static getResultProperties = getResultProperties;
  public static getNodesDeleted = getNodesDeleted;
  public static getRelationshipsDeleted = getRelationshipsDeleted;
}
