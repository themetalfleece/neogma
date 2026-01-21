import type { AnyObject } from '../shared.types';
import type { RelationshipsI, NeogmaModel } from '../model.types';

export interface RelationshipConfigContext<
  RelatedNodesToAssociateI extends AnyObject,
> {
  relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
  modelName: string;
  Model: NeogmaModel<any, RelatedNodesToAssociateI, any, any>;
}
