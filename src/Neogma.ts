import * as neo4j_driver from 'neo4j-driver';
import { Config, Driver, Session, Transaction } from 'neo4j-driver';
import { ModelFactory, NeogmaModel } from './ModelOps';
import {
  Neo4jSupportedProperties,
  QueryRunner,
  Runnable,
} from './Queries/QueryRunner';
import { getRunnable, getSession, getTransaction } from './Sessions/Sessions';
import { NeogmaConnectivityError } from './Errors/NeogmaConnectivityError';
import {
  AnyObject,
  NeogmaModelMetadata,
  getModelMetadata,
  getRelatedModelMetadata,
  parseModelMetadata,
} from './Decorators';
const neo4j = neo4j_driver;

interface ConnectParamsI {
  url: string;
  username: string;
  password: string;
}

interface ConnectOptionsI extends Config {
  /** whether to log the statements and parameters to the console */
  logger?: QueryRunner['logger'];
}

export class Neogma {
  public readonly driver: Driver;
  public readonly queryRunner: QueryRunner;
  /** a map between each Model's modelName and the Model itself */
  public models: Record<string, NeogmaModel<any, any, any, any>> = {};

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
    } catch (err) {
      throw new NeogmaConnectivityError(err);
    }

    this.queryRunner = new QueryRunner({
      driver: this.driver,
      logger: options?.logger,
    });
  }

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
  ): Promise<T> => {
    return getSession<T>(runInSession, callback, this.driver);
  };

  public getTransaction = <T>(
    runInTransaction: Runnable | null,
    callback: (tx: Transaction) => Promise<T>,
  ): Promise<T> => {
    return getTransaction<T>(runInTransaction, callback, this.driver);
  };

  public getRunnable = <T>(
    runInExisting: Runnable | null,
    callback: (tx: Runnable) => Promise<T>,
  ): Promise<T> => {
    return getRunnable<T>(runInExisting, callback, this.driver);
  };

  public generateModelFromMetadata = <
    P extends Neo4jSupportedProperties,
    R extends AnyObject = object,
    M extends AnyObject = object,
    S extends AnyObject = object,
  >(
    metadata: NeogmaModelMetadata,
  ): NeogmaModel<P, R, M, S> => {
    const parsedMetadata = parseModelMetadata(metadata);
    const relationships = parsedMetadata.relationships ?? [];
    for (const relationship in relationships) {
      const relatedModel = metadata.relationships[relationship].model;
      if (relatedModel === 'self') {
        continue;
      }
      const relatedModelLabel = relatedModel['name'];
      if (this.models[relatedModelLabel]) {
        relationships[relationship].model = this.models[relatedModelLabel];
      } else {
        const relatedModelMetadata = getRelatedModelMetadata(relatedModel);
        relationships[relationship].model =
          this.generateModelFromMetadata(relatedModelMetadata);
      }
    }

    return ModelFactory(parsedMetadata, this) as unknown as NeogmaModel<
      P,
      R,
      M,
      S
    >;
  };

  public addModel = <
    P extends Neo4jSupportedProperties,
    R extends AnyObject = object,
    M extends AnyObject = object,
    S extends AnyObject = object,
  >(
    model: Object,
  ): NeogmaModel<P, R, M, S> => {
    const metadata = getModelMetadata(model);
    return this.generateModelFromMetadata(metadata);
  };

  public addModels = (models: Object[]): void => {
    for (const model of models) {
      this.addModel(model);
    }
  };
}
