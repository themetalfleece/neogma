import type { QueryResult } from 'neo4j-driver';

import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';
export type { InstanceRelationshipContext } from '../relateTo/relateTo.types';

/** Result type for a single relationship entry */
export type UpdateRelationshipResultEntry<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = {
  source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
  target: RelatedNodesToAssociateI[Alias]['Instance'];
  relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
};

/** Result type for updateRelationship - tuple of [relationships[], QueryResult] when return is true, [[], QueryResult] when false */
export type UpdateRelationshipResult<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
  Return extends boolean = false,
> = Return extends true
  ? [
      Array<
        UpdateRelationshipResultEntry<
          Properties,
          RelatedNodesToAssociateI,
          MethodsI,
          Alias
        >
      >,
      QueryResult,
    ]
  : [[], QueryResult];

/**
 * Type-safe data for updating relationship properties.
 * Allows partial updates to relationship properties.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being updated.
 */
export type UpdateRelationshipData<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = Partial<RelatedNodesToAssociateI[Alias]['RelationshipProperties']>;

/**
 * Type-safe where clause for updateRelationship static method.
 * Constrains property names for source, target, and relationship to their actual properties.
 */
export type UpdateRelationshipWhereClause<
  SourceProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = {
  source?: WhereParamsI<SourceProperties>;
  target?: WhereParamsI<
    ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
  >;
  relationship?: WhereParamsI<
    RelatedNodesToAssociateI[Alias]['RelationshipProperties']
  >;
};

/**
 * Parameters for the static updateRelationship method.
 * @typeParam SourceProperties - The source model's property types.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being updated.
 */
export interface UpdateRelationshipParams<
  SourceProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  /** Where clause with type-safe property validation for source, target, and relationship. */
  where?: UpdateRelationshipWhereClause<
    SourceProperties,
    RelatedNodesToAssociateI,
    Alias
  >;
  /**
   * When true, the first element of the returned tuple contains the updated relationships.
   * When false (default), the first element is an empty array.
   */
  return?: boolean;
  /**
   * When true, throws NeogmaNotFoundError if no relationships were updated.
   * @default false
   */
  throwIfNoneUpdated?: boolean;
}

/**
 * Type-safe where clause for updateRelationship instance method.
 * Constrains property names for target and relationship to their actual properties.
 */
export type InstanceUpdateRelationshipWhereClause<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> = {
  target?: WhereParamsI<
    ExtractPropertiesFromInstance<RelatedNodesToAssociateI[Alias]['Instance']>
  >;
  relationship?: WhereParamsI<
    RelatedNodesToAssociateI[Alias]['RelationshipProperties']
  >;
};

/**
 * Parameters for the instance updateRelationship method.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being updated.
 */
export interface InstanceUpdateRelationshipParams<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  /** Where clause with type-safe property validation for target and relationship. */
  where?: InstanceUpdateRelationshipWhereClause<
    RelatedNodesToAssociateI,
    Alias
  >;
  /**
   * When true, the first element of the returned tuple contains the updated relationships.
   * When false (default), the first element is an empty array.
   */
  return?: boolean;
  /**
   * When true, throws NeogmaNotFoundError if no relationships were updated.
   * @default false
   */
  throwIfNoneUpdated?: boolean;
}
