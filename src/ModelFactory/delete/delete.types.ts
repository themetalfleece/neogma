import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { NeogmaModel } from '../model.types';
import type { GenericConfiguration } from '../shared.types';

// Static delete context
export interface DeleteContext {
  queryRunner: QueryRunner;
  getLabel: () => string;
}

export interface DeleteParams extends GenericConfiguration {
  detach?: boolean;
  where: WhereParamsI;
}

// Instance delete context
export interface InstanceDeleteContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends Record<string, any>,
  MethodsI extends Record<string, any>,
> {
  Model: NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, any>;
  primaryKeyField: string | undefined;
  assertPrimaryKeyField: (
    primaryKeyField: string | undefined,
    operation: string,
  ) => string;
}

export interface InstanceDeleteConfiguration extends GenericConfiguration {
  detach?: boolean;
}
