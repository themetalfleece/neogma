import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

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

/**
 * Parameters for the static update method.
 * @typeParam Properties - The model's property types for type-safe where clause validation.
 */
export interface UpdateParams<
  Properties = Record<string, unknown>,
> extends GenericConfiguration {
  /** Where clause with type-safe property name and value validation. */
  where?: WhereParamsI<Properties>;
  /**
   * When true, the first element of the returned tuple contains the updated instances.
   * When false (default), the first element is an empty array.
   */
  return?: boolean;
}
