import type { Neo4jSupportedProperties, QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { NeogmaModel } from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Static delete context
export interface DeleteContext {
  queryRunner: QueryRunner;
  getLabel: () => string;
}

/**
 * Parameters for the static delete method.
 * @typeParam Properties - The model's property types for type-safe where clause validation.
 */
export interface DeleteParams<
  Properties = Record<string, unknown>,
> extends GenericConfiguration {
  detach?: boolean;
  /** Where clause with type-safe property name and value validation. */
  where: WhereParamsI<Properties>;
}

// Instance delete context
export interface InstanceDeleteContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
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
