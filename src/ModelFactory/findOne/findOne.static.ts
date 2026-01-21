import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { findMany } from '../findMany';
import type { FindContext } from '../findMany/findMany.types';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { FindOneParams } from './findOne.types';

/**
 * Finds a single node matching the query.
 */
export async function findOne<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params?: FindOneParams<Properties> & { plain?: Plain },
): Promise<
  | (Plain extends true
      ? Properties
      : NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>)
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

  return (instance || null) as
    | (Plain extends true
        ? Properties
        : NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>)
    | null;
}
