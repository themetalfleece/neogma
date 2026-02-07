import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { findMany } from '../findMany';
import type {
  InstanceWithRelationships,
  PlainWithRelationships,
} from '../findMany/eagerLoading.types';
import type { FindContext } from '../findMany/findMany.types';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { FindOneParams } from './findOne.types';

/**
 * Finds a single node matching the query.
 * Optionally eagerly loads relationships when the `relationships` parameter is provided.
 *
 * @example
 * ```typescript
 * // Simple find
 * const user = await Users.findOne({ where: { id: userId } });
 *
 * // With eager loading
 * const userWithOrders = await Users.findOne({
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
export async function findOne<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params?: FindOneParams<Properties, RelatedNodesToAssociateI> & {
    plain?: Plain;
  },
): Promise<
  | (Plain extends true
      ? PlainWithRelationships<Properties, RelatedNodesToAssociateI>
      : InstanceWithRelationships<
          NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
          RelatedNodesToAssociateI
        >)
  | null
> {
  const instances = await findMany(ctx, {
    ...params,
    limit: 1,
  });

  const instance = instances?.[0];

  if (params?.throwIfNotFound && !instance) {
    throw new NeogmaNotFoundError('Nodes not found', {
      label: ctx.getLabel(),
    });
  }

  type Result =
    | (Plain extends true
        ? PlainWithRelationships<Properties, RelatedNodesToAssociateI>
        : InstanceWithRelationships<
            NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
            RelatedNodesToAssociateI
          >)
    | null;

  return (instance || null) as Result;
}
