import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { ExtractPropertiesFromInstance, WhereParamsI } from '../../Where';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';
export type { InstanceRelationshipContext } from '../relateTo/relateTo.types';

/**
 * Type-safe where clause for findRelationships static method.
 * Constrains property names for source, target, and relationship to their actual properties.
 */
export type FindRelationshipsWhereClause<
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

export interface FindRelationshipsParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where?: FindRelationshipsWhereClause<
    Properties,
    RelatedNodesToAssociateI,
    Alias
  >;
  limit?: number;
  skip?: number;
  minHops?: number;
  maxHops?: number;
  order?: Array<
    | {
        on: 'source';
        property: Extract<keyof Properties, string>;
        direction: 'ASC' | 'DESC';
      }
    | {
        on: 'target';
        property: Extract<
          keyof RelatedNodesToAssociateI[Alias]['Instance'],
          string
        >;
        direction: 'ASC' | 'DESC';
      }
    | {
        on: 'relationship';
        property: Extract<
          keyof RelatedNodesToAssociateI[Alias]['RelationshipProperties'],
          string
        >;
        direction: 'ASC' | 'DESC';
      }
  >;
}

/**
 * Type-safe where clause for findRelationships instance method.
 * Constrains property names for target and relationship to their actual properties.
 */
export type InstanceFindRelationshipsWhereClause<
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

export interface InstanceFindRelationshipsParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where?: InstanceFindRelationshipsWhereClause<RelatedNodesToAssociateI, Alias>;
  limit?: number;
  skip?: number;
  order?: Array<
    | {
        on: 'source';
        property: Extract<keyof Properties, string>;
        direction: 'ASC' | 'DESC';
      }
    | {
        on: 'target';
        property: Extract<
          keyof RelatedNodesToAssociateI[Alias]['Instance'],
          string
        >;
        direction: 'ASC' | 'DESC';
      }
    | {
        on: 'relationship';
        property: Extract<
          keyof RelatedNodesToAssociateI[Alias]['RelationshipProperties'],
          string
        >;
        direction: 'ASC' | 'DESC';
      }
  >;
}
