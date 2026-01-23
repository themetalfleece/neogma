import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { InstanceRelationshipContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import { getInstanceProperty } from '../utils/propertyAccessor';
import type { InstanceFindRelationshipsParams } from './findRelationships.types';

/**
 * Finds relationships from this instance to target nodes.
 */
export async function instanceFindRelationships<
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
  params: InstanceFindRelationshipsParams<
    Properties,
    RelatedNodesToAssociateI,
    Alias
  >,
): Promise<
  Array<{
    source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
    target: RelatedNodesToAssociateI[Alias]['Instance'];
    relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
  }>
> {
  const { where, alias, limit, skip, session, order } = params;
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'findRelationships',
  );

  const res = await ctx.Model.findRelationships({
    alias,
    limit,
    skip,
    session,
    order,
    where: {
      relationship: where?.relationship,
      target: where?.target,
      source: {
        [primaryKeyField]: getInstanceProperty(instance, primaryKeyField),
      },
    },
  });

  return res as Array<{
    source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
    target: RelatedNodesToAssociateI[Alias]['Instance'];
    relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
  }>;
}
