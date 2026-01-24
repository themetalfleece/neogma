import type { WhereParamsI } from '../../Where';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export RelationshipCrudContext from relateTo since they share the same context
export type { RelationshipCrudContext } from '../relateTo/relateTo.types';
export type { InstanceRelationshipContext } from '../relateTo/relateTo.types';

export interface UpdateRelationshipParams<
  RelatedNodesToAssociateI extends AnyObject,
> extends GenericConfiguration {
  alias: keyof RelatedNodesToAssociateI;
  where?: {
    source?: WhereParamsI;
    target?: WhereParamsI;
    relationship?: WhereParamsI;
  };
}

export interface InstanceUpdateRelationshipParams<
  RelatedNodesToAssociateI extends AnyObject,
> extends GenericConfiguration {
  alias: keyof RelatedNodesToAssociateI;
  where?: {
    target?: WhereParamsI;
    relationship?: WhereParamsI;
  };
}
