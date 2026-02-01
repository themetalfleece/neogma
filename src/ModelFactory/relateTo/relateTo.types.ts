import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type {
  NeogmaInstance,
  NeogmaModel,
  RelationshipsI,
} from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

/** Result type for a single relationship entry */
export type RelateToResultEntry<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = {
  source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
  target: RelatedNodesToAssociateI[Alias]['Instance'];
  relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
};

/** Result type for relateTo - tuple of [relationships[], count] */
export type RelateToResult<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = [
  Array<
    RelateToResultEntry<Properties, RelatedNodesToAssociateI, MethodsI, Alias>
  >,
  number,
];

export interface RelationshipCrudContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  Model: NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, any>;
  queryRunner: QueryRunner;
  getLabel: () => string;
  getRelationshipConfiguration: (
    alias: keyof RelatedNodesToAssociateI,
  ) => Required<
    RelationshipsI<RelatedNodesToAssociateI>[keyof RelatedNodesToAssociateI]
  >;
  getRelationshipByAlias: (
    alias: keyof RelatedNodesToAssociateI,
  ) => Pick<
    RelationshipsI<RelatedNodesToAssociateI>[keyof RelatedNodesToAssociateI],
    'name' | 'direction' | 'model'
  >;
  getRelationshipModel: (
    relationshipModel: NeogmaModel<any, any, any, any> | 'self',
  ) => NeogmaModel<any, any, any, any>;
  getRelationshipProperties: (
    relationship: RelationshipsI<any>[0],
    dataToUse: Neo4jSupportedProperties,
  ) => Neo4jSupportedProperties;
  buildFromRecord: (record: {
    properties: Properties;
    labels: string[];
  }) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
}

/**
 * Type-safe where clause for relateTo static method.
 * Constrains property names for source and target to their actual properties.
 * @typeParam SourceProperties - The source model's property types.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being created.
 */
export type RelateToWhereClause<
  SourceProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = {
  source: WhereParamsI<SourceProperties>;
  target: WhereParamsI<
    ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
  >;
};

/**
 * Parameters for the static relateTo method.
 * @typeParam SourceProperties - The source model's property types.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being created.
 */
export interface RelateToParams<
  SourceProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  /** Where clause with type-safe property validation for source and target. */
  where: RelateToWhereClause<SourceProperties, RelatedNodesToAssociateI, Alias>;
  properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
  assertCreatedRelationships?: number;
  /**
   * When true, the first element of the returned tuple contains the created relationships.
   * When false (default), the first element is an empty array.
   */
  return?: boolean;
  /**
   * When true, throws NeogmaNotFoundError if no relationships were created.
   * @default false
   */
  throwIfNoneCreated?: boolean;
}

// Instance relateTo types
export interface InstanceRelationshipContext<
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

/**
 * Parameters for the instance relateTo method.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being created.
 */
export interface InstanceRelateToParams<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  /** Where clause with type-safe property validation for target. */
  where: WhereParamsI<
    ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
  >;
  properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
  assertCreatedRelationships?: number;
  /**
   * When true, the first element of the returned tuple contains the created relationships.
   * When false (default), the first element is an empty array.
   */
  return?: boolean;
  /**
   * When true, throws NeogmaNotFoundError if no relationships were created.
   * @default false
   */
  throwIfNoneCreated?: boolean;
}
