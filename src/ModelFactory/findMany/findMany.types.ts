import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

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
  where?: WhereParamsI<Properties>;
  limit?: number;
  skip?: number;
  order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
  plain?: boolean;
  throwIfNoneFound?: boolean;
}
