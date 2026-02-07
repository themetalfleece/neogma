import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { AnyObject } from '../shared.types';
import type { FindManyWithRelationshipsResult } from './eagerLoading.types';
import type { FindContext, FindManyParams } from './findMany.types';
import { findManyStandard } from './findManyStandard';
import { findManyWithRelationships } from './findManyWithRelationships';

/**
 * Finds multiple nodes matching the query.
 * Optionally eagerly loads relationships when the `relationships` parameter is provided.
 *
 * @example
 * ```typescript
 * // Simple find
 * const users = await Users.findMany({ where: { status: 'active' } });
 *
 * // With eager loading
 * const usersWithOrders = await Users.findMany({
 *   where: { status: 'active' },
 *   relationships: {
 *     Orders: {
 *       where: { target: { status: 'completed' } },
 *       limit: 10
 *     }
 *   }
 * });
 *
 * // With eager loading and plain: true
 * const plainUsers = await Users.findMany({
 *   where: { status: 'active' },
 *   plain: true,
 *   relationships: {
 *     Orders: { limit: 5 }
 *   }
 * });
 * // Returns: [{ id, name, Orders: [{ node: {...}, relationship: {...} }] }]
 * ```
 */
export async function findMany<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params?: FindManyParams<Properties, RelatedNodesToAssociateI> & {
    plain?: Plain;
  },
): Promise<
  FindManyWithRelationshipsResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Plain
  >
> {
  // Use eager loading when relationships are requested
  const hasRelationships =
    params?.relationships && Object.keys(params.relationships).length > 0;

  if (hasRelationships) {
    return findManyWithRelationships(
      ctx,
      params as FindManyParams<Properties, RelatedNodesToAssociateI> & {
        relationships: NonNullable<
          FindManyParams<Properties, RelatedNodesToAssociateI>['relationships']
        >;
        plain?: Plain;
      },
    );
  }

  return findManyStandard(ctx, params);
}
