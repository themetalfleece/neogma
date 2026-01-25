import * as neo4j_driver from 'neo4j-driver';
import { Config, Driver, Session, Transaction } from 'neo4j-driver';

import { NeogmaConnectivityError } from './Errors/NeogmaConnectivityError';
import { NeogmaModel } from './ModelFactory';
import { QueryBuilder } from './QueryBuilder';
import { QueryRunner, Runnable } from './QueryRunner';
import { getRunnable, getSession, getTransaction } from './Sessions/Sessions';
import {
  clearAllTempDatabases,
  clearTempDatabase,
  clearTempDatabasesOlderThan,
  createTempDatabase,
} from './utils/temp';
const neo4j = neo4j_driver;

interface ConnectParamsI {
  url: string;
  username: string;
  password: string;
  database?: string;
}

interface ConnectOptionsI extends Config {
  /** whether to log the statements and parameters to the console */
  logger?: QueryRunner['logger'];
}

/**
 * Main class for connecting to and interacting with a Neo4j database.
 * Provides the connection driver, query runner, and model registry.
 *
 * @example
 * ```ts
 * const neogma = new Neogma(
 *   { url: 'bolt://localhost:7687', username: 'neo4j', password: 'password' },
 *   { logger: console.log }
 * );
 * await neogma.verifyConnectivity();
 * ```
 */
export class Neogma {
  /** The Neo4j driver instance for database connections */
  public readonly driver: Driver;
  /** The QueryRunner instance for executing queries */
  public readonly queryRunner: QueryRunner;
  /** A map between each Model's modelName and the Model itself */
  public modelsByName: Record<string, NeogmaModel<any, any, any, any>> = {};
  /** The default database name used for queries */
  public database?: string;

  /**
   * Creates a new Neogma instance and establishes a connection to the Neo4j database.
   *
   * @param params - The connection parameters
   * @param params.url - The Neo4j connection URL (e.g., 'bolt://localhost:7687')
   * @param params.username - The database username
   * @param params.password - The database password
   * @param params.database - Optional default database name
   * @param options - Additional Neo4j driver configuration options
   * @throws {NeogmaConnectivityError} If the connection fails
   */
  constructor(params: ConnectParamsI, options?: ConnectOptionsI) {
    const { url, username, password } = params;

    try {
      this.driver = neo4j.driver(
        url,
        neo4j.auth.basic(username, password),
        options,
      );

      this.database = params.database;
    } catch (err) {
      throw new NeogmaConnectivityError({ error: err });
    }

    this.queryRunner = new QueryRunner({
      driver: this.driver,
      logger: options?.logger,
      sessionParams: {
        database: this.database,
      },
    });

    QueryBuilder.queryRunner = this.queryRunner;
  }

  /**
   * Creates a new Neogma instance with a temporary database.
   * Useful for testing scenarios where an isolated database is needed.
   *
   * @param params - The connection parameters
   * @param options - Additional Neo4j driver configuration options
   * @returns A Neogma instance connected to the newly created temporary database
   */
  public static fromTempDatabase = async (
    params: ConnectParamsI,
    options?: ConnectOptionsI,
  ): Promise<Neogma> => {
    const { url, username, password } = params;

    const driver = neo4j.driver(
      url,
      neo4j.auth.basic(username, password),
      options,
    );

    const database = await createTempDatabase(driver);

    await driver.close();

    return new Neogma({ ...params, database });
  };

  public clearTempDatabase = async (database: string) =>
    clearTempDatabase(this.driver, database);

  public clearAllTempDatabases = async () => clearAllTempDatabases(this.driver);

  public clearTempDatabasesOlderThan = async (seconds: number) =>
    clearTempDatabasesOlderThan(this.driver, seconds);

  /**
   * Verifies the connection to the Neo4j database.
   *
   * @throws {NeogmaConnectivityError} If the connection verification fails
   */
  public verifyConnectivity = async (): Promise<void> => {
    try {
      await this.driver.verifyConnectivity();
    } catch (err) {
      throw new NeogmaConnectivityError({ error: err });
    }
  };

  public getSession = <T>(
    runInSession: Session | null,
    callback: (s: Session) => Promise<T>,
    /**
     * Override the configuration of the session.
     * By default, the "database" param used in the constructor is always passed.
     */
    sessionConfig?: neo4j_driver.SessionConfig,
  ): Promise<T> => {
    return getSession<T>(runInSession, callback, this.driver, {
      database: this.database,
      ...sessionConfig,
    });
  };

  public getTransaction = <T>(
    runInTransaction: Runnable | null,
    callback: (tx: Transaction) => Promise<T>,
    /**
     * Override the configuration of the session.
     * By default, the "database" param used in the constructor is always passed.
     */
    sessionConfig?: neo4j_driver.SessionConfig,
  ): Promise<T> => {
    return getTransaction<T>(runInTransaction, callback, this.driver, {
      database: this.database,
      ...sessionConfig,
    });
  };

  public getRunnable = <T>(
    runInExisting: Runnable | null,
    callback: (tx: Runnable) => Promise<T>,
    /**
     * Override the configuration of the session.
     * By default, the "database" param used in the constructor is always passed.
     */
    sessionConfig?: neo4j_driver.SessionConfig,
  ): Promise<T> => {
    return getRunnable<T>(runInExisting, callback, this.driver, {
      database: this.database,
      ...sessionConfig,
    });
  };
}
