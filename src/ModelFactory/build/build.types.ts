import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance, RelationshipsI } from '../model.types';
import type { AnyObject } from '../shared.types';

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
