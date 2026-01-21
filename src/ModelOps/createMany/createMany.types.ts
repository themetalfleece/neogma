import type { Neo4jSupportedProperties, QueryRunner } from '../../Queries';
import type { AnyObject } from '../shared.types';
import type {
  NeogmaInstance,
  NeogmaModel,
  CreateDataI,
  RelationshipsI,
} from '../model.types';

export interface CreateContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  /** The current Model */
  Model: NeogmaModel<Properties, RelatedNodesToAssociateI, MethodsI, any>;
  /** The Model class constructor for instanceof checks */
  ModelClass: new () => any;
  queryRunner: QueryRunner;
  getLabel: () => string;
  getRawLabels: () => string[];
  build: (
    data: CreateDataI<Properties, RelatedNodesToAssociateI>,
    params?: { status?: 'new' | 'existing' },
  ) => NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
  getRelationshipConfiguration: (
    alias: string,
  ) => Required<RelationshipsI<any>[0]>;
  getRelationshipModel: (
    relationshipModel: NeogmaModel<any, any, any, any> | 'self',
  ) => NeogmaModel<any, any, any, any>;
  getRelationshipProperties: (
    relationship: RelationshipsI<any>[0],
    dataToUse: Neo4jSupportedProperties,
  ) => Neo4jSupportedProperties;
}
