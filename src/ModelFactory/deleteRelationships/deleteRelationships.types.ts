import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';

/**
 * Type-safe where clause for deleteRelationships.
 * Constrains property names for source, target, and relationship to their actual properties.
 */
export type DeleteRelationshipsWhereClause<
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
 * Parameters for the static deleteRelationships method.
 * @typeParam SourceProperties - The source model's property types.
 * @typeParam RelatedNodesToAssociateI - The model's relationship definitions.
 * @typeParam Alias - The relationship alias being deleted.
 */
export interface DeleteRelationshipsParams<
  SourceProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  /** Where clause with type-safe property validation for source, target, and relationship. */
  where: DeleteRelationshipsWhereClause<
    SourceProperties,
    RelatedNodesToAssociateI,
    Alias
  >;
}
