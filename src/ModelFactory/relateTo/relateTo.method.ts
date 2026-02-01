import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import { getInstanceProperty } from '../utils/propertyAccessor';
import type { RelateToResult } from './relateTo.static';
import type {
  InstanceRelateToParams,
  InstanceRelationshipContext,
} from './relateTo.types';

/**
 * Creates a relationship from this instance to a target node.
 * @returns A tuple of [relationships, count] where relationships is populated when return: true
 */
export async function instanceRelateTo<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  ctx: InstanceRelationshipContext<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >,
  params: InstanceRelateToParams<RelatedNodesToAssociateI, Alias>,
): Promise<
  RelateToResult<Properties, RelatedNodesToAssociateI, MethodsI, Alias>
> {
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'relateTo',
  );

  return ctx.Model.relateTo({
    ...params,
    where: {
      source: {
        [primaryKeyField]: getInstanceProperty(instance, primaryKeyField),
      },
      target: params.where,
    },
  });
}
