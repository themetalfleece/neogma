import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';
export type { InstanceRelationshipContext } from '../relateTo/relateTo.types';

export interface FindRelationshipsParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where?: {
    source?: WhereParamsI;
    target?: WhereParamsI;
    relationship?: WhereParamsI;
  };
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

export interface InstanceFindRelationshipsParams<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where?: {
    target: WhereParamsI;
    relationship: WhereParamsI;
  };
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
