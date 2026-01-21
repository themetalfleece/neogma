import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject } from '../shared.types';
import type {
  NeogmaInstance,
  CreateDataI,
  RelationshipsI,
} from '../model.types';

export interface BuildContext<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
> {
  /** The Model class constructor */
  ModelClass: new () => NeogmaInstance<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >;
  /** Schema keys */
  schema: Record<string, unknown>;
  /** Model relationships */
  relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
}
