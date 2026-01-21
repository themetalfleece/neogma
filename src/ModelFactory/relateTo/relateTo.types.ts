import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { QueryRunner } from '../../QueryRunner';
import type { WhereParamsI } from '../../Where';
import type {
  NeogmaInstance,
  NeogmaModel,
  RelationshipsI,
} from '../model.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

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

export interface RelateToParams<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where: {
    source: WhereParamsI;
    target: WhereParamsI;
  };
  properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
  assertCreatedRelationships?: number;
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

export interface InstanceRelateToParams<
  RelatedNodesToAssociateI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
> extends GenericConfiguration {
  alias: Alias;
  where: WhereParamsI;
  properties?: RelatedNodesToAssociateI[Alias]['CreateRelationshipProperties'];
  assertCreatedRelationships?: number;
}
