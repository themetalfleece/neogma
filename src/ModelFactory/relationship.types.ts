import type { Neo4jSupportedTypes } from '../QueryRunner';
import type { WhereParamsI } from '../Where';
import type { AnyObject } from './shared.types';

/** the type of the properties to be added to a relationship */
export type RelationshipPropertiesI = Record<
  string,
  Neo4jSupportedTypes | undefined
>;

/** the type to be used in RelationshipTypePropertyForCreateI.where */
export type RelationshipTypePropertyForCreateWhereI<
  RelationshipProperties extends RelationshipPropertiesI,
> = {
  /** where for the target nodes */
  params: WhereParamsI;
  /** whether to merge instead of create the relationship */
  merge?: boolean;
  relationshipProperties?: Partial<RelationshipProperties>;
};

/** the type of the relationship along with the properties, so the proper relationship and/or nodes can be created */
export type RelationshipTypePropertyForCreateI<
  Properties,
  RelationshipProperties extends RelationshipPropertiesI,
> = {
  /** create new nodes and create a relationship with them */
  properties?: Array<Properties & Partial<RelationshipProperties>>;
  /** configuration for merging instead of creating the properties/relationships */
  propertiesMergeConfig?: {
    /** merge the created nodes instead of creating them */
    nodes?: boolean;
    /** merge the relationship with the created properties instead of creating it */
    relationship?: boolean;
  };
  /** create a relationship with nodes which are matched by the where */
  where?:
    | RelationshipTypePropertyForCreateWhereI<RelationshipProperties>
    | Array<RelationshipTypePropertyForCreateWhereI<RelationshipProperties>>;
};

/** to be used in create functions where the related nodes can be passed for creation */
export type RelatedNodesCreationParamI<
  RelatedNodesToAssociateI extends AnyObject,
> = {
  [key in keyof Partial<RelatedNodesToAssociateI>]: RelationshipTypePropertyForCreateI<
    RelatedNodesToAssociateI[key]['CreateData'],
    RelatedNodesToAssociateI[key]['CreateRelationshipProperties']
  >;
};
