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
  NeogmaNodeMetadata,
  getNodeMetadata,
  getRelatedNodeMetadata,
  parseNodeMetadata,
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
  /** a map between each Node's modelName and the Node itself */
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

  public generateNodeFromMetadata = <
    P extends Neo4jSupportedProperties,
    R extends AnyObject = object,
    M extends AnyObject = object,
    S extends AnyObject = object,
  >(
    metadata: NeogmaNodeMetadata,
  ): NeogmaModel<P, R, M, S> => {
    const parsedMetadata = parseNodeMetadata(metadata);
    const relationships = parsedMetadata.relationships ?? [];
    for (const relationship in relationships) {
      const relatedNode = metadata.relationships[relationship].model;
      if (relatedNode === 'self') {
        continue;
      }
      const relatedNodeLabel = relatedNode['name'];
      if (this.models[relatedNodeLabel]) {
        relationships[relationship].model = this.models[relatedNodeLabel];
      } else {
        const relatedNodeMetadata = getRelatedNodeMetadata(relatedNode);
        relationships[relationship].model =
          this.generateNodeFromMetadata(relatedNodeMetadata);
      }
    }

    return ModelFactory(parsedMetadata, this) as unknown as NeogmaModel<
      P,
      R,
      M,
      S
    >;
  };

  public addNode = <
    P extends Neo4jSupportedProperties,
    R extends AnyObject = object,
    M extends AnyObject = object,
    S extends AnyObject = object,
  >(
    model: Object,
  ): NeogmaModel<P, R, M, S> => {
    const metadata = getNodeMetadata(model);
    return this.generateNodeFromMetadata(metadata);
  };

  public addNodes = (models: Object[]): void => {
    for (const model of models) {
      this.addNode(model);
    }
  };
}
