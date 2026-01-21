import type { QueryRunner } from '../../Queries/QueryRunner';
import type { WhereParamsI } from '../../Queries/Where';
import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject, GenericConfiguration } from '../shared.types';
import type { NeogmaInstance } from '../model.types';

export interface UpdateContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  queryRunner: QueryRunner;
  getLabel: () => string;
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
}

export interface UpdateParams extends GenericConfiguration {
  where?: WhereParamsI;
  return?: boolean;
}
