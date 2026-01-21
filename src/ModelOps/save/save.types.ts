import type { Neo4jSupportedProperties } from '../../Queries';
import type { NeogmaModel } from '../model.types';
import type { GenericConfiguration } from '../shared.types';

export interface SaveContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends Record<string, any>,
  MethodsI extends Record<string, any>,
> {
  Model: NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, any>;
  schemaKeys: Set<string>;
  primaryKeyField: string | undefined;
  assertPrimaryKeyField: (
    primaryKeyField: string | undefined,
    operation: string,
  ) => string;
}

export interface SaveConfiguration extends GenericConfiguration {
  validate?: boolean;
}
