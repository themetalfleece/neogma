import type { WhereParamsI } from '../../Where';
import type { RelationshipsLoadConfig } from '../findMany/eagerLoading.types';
import type { AnyObject, GenericConfiguration } from '../shared.types';

// Re-export FindContext from findMany since they share the same context
export type { FindContext } from '../findMany/findMany.types';

export interface FindOneParams<
  Properties,
  RelatedNodesToAssociateI extends AnyObject = AnyObject,
> extends GenericConfiguration {
  where?: WhereParamsI<Properties>;
  order?: Array<[Extract<keyof Properties, string>, 'ASC' | 'DESC']>;
  /**
   * Returns an array of the plain properties, instead of Instances.
   * When `relationships` is provided, includes them on each plain object.
   */
  plain?: boolean;
  /** throws an error if the node is not found */
  throwIfNotFound?: boolean;
  /**
   * Relationships to eagerly load with the result.
   * Each key is a relationship alias defined on the model.
   *
   * @example
   * ```typescript
   * const user = await Users.findOne({
   *   where: { id: userId },
   *   relationships: {
   *     Orders: {
   *       where: { target: { status: 'completed' } },
   *       limit: 10
   *     }
   *   }
   * });
   * ```
   */
  relationships?: RelationshipsLoadConfig<RelatedNodesToAssociateI>;
}
