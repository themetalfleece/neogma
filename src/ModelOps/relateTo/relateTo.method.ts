import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject } from '../shared.types';
import type { NeogmaInstance } from '../model.types';
import type {
  InstanceRelationshipContext,
  InstanceRelateToParams,
} from './relateTo.types';

/**
 * Creates a relationship from this instance to a target node.
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
): Promise<number> {
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'relateTo',
  );

  return ctx.Model.relateTo({
    ...params,
    where: {
      source: {
        [primaryKeyField]: (instance as any)[primaryKeyField],
      },
      target: params.where,
    },
  });
}
