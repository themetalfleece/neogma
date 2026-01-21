import type { QueryRunner } from '../../Queries/QueryRunner';
import type { WhereParamsI } from '../../Queries/Where';
import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject, GenericConfiguration } from '../shared.types';
import type { NeogmaInstance } from '../model.types';

export interface FindContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  queryRunner: QueryRunner;
  modelName: string;
  schemaKeys: Set<string>;
  getLabel: () => string;
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
}

export interface FindManyParams<Properties> extends GenericConfiguration {
  where?: WhereParamsI;
  limit?: number;
  skip?: number;
  order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
  plain?: boolean;
  throwIfNoneFound?: boolean;
}
