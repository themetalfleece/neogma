import type { NeogmaModel, RelationshipsI } from '../model.types';
import type { AnyObject } from '../shared.types';

export interface RelationshipConfigContext<
  RelatedNodesToAssociateI extends AnyObject,
> {
  relationships: Partial<RelationshipsI<RelatedNodesToAssociateI>>;
  modelName: string;
  Model: NeogmaModel<any, RelatedNodesToAssociateI, any, any>;
}
