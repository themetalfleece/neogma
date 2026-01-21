import { Driver, QueryResult, SessionConfig } from 'neo4j-driver';

import { create, CreateParams } from './create';
import { createRelationship } from './createRelationship';
import { deleteNodes, DeleteParams } from './delete';
import {
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
import { update, UpdateParams } from './update';

type AnyObject = Record<string, any>;

export class QueryRunner {
  private driver: Driver;
  public sessionParams?: SessionConfig;
  /** whether to log the statements and parameters with the given function */
  private logger:
    | null
    | ((...val: Array<string | boolean | AnyObject | number>) => any);
  /** maps a session object to a uuid, for logging purposes */
  private sessionIdentifiers = new WeakMap<Runnable, string>([]);

  constructor(params: {
    driver: QueryRunner['driver'];
    logger?: QueryRunner['logger'];
    /** these params will be used when creating a new session to run any query */
    sessionParams?: SessionConfig;
  }) {
    this.driver = params.driver;
    this.logger = params?.logger || null;
    this.sessionParams = params.sessionParams;
  }

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
    },
  };

  public static getResultProperties = getResultProperties;
  public static getNodesDeleted = getNodesDeleted;
  public static getRelationshipsDeleted = getRelationshipsDeleted;
}
