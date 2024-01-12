import * as neo4j_driver from 'neo4j-driver';
import { Config, Driver, Session, Transaction } from 'neo4j-driver';
import { NeogmaModel } from './ModelOps';
import { QueryRunner, Runnable } from './Queries/QueryRunner';
import { getRunnable, getSession, getTransaction } from './Sessions/Sessions';
import { NeogmaConnectivityError } from './Errors/NeogmaConnectivityError';
import { QueryBuilder } from './Queries';
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

export class Neogma {
  public readonly driver: Driver;
  public readonly queryRunner: QueryRunner;
  /** a map between each Model's modelName and the Model itself */
  public modelsByName: Record<string, NeogmaModel<any, any, any, any>> = {};
  public database?: string;

  /**
   *
   * @param {ConnectParamsI} params - the connection params
   * @param {ConnectOptionsI} options - additional options for the QueryRunner
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
      throw new NeogmaConnectivityError(err);
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
   *
   * @param {ConnectParamsI} params - the connection params
   * @param {ConnectOptionsI} options - additional options for the QueryRunner
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

  public verifyConnectivity = async (): Promise<void> => {
    try {
      await this.driver.verifyConnectivity();
    } catch (err) {
      throw new NeogmaConnectivityError(err);
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
