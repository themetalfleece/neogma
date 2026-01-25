import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';
export type { InstanceRelationshipContext } from '../relateTo/relateTo.types';

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
}
