import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { InstanceRelationshipContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import { getInstanceProperty } from '../utils/propertyAccessor';
import type { UpdateRelationshipResult } from './updateRelationship.static';
import type {
  InstanceUpdateRelationshipParams,
  UpdateRelationshipData,
} from './updateRelationship.types';

/**
 * Updates relationship properties from this instance to target nodes.
 * @returns A tuple of [relationships, QueryResult] where relationships is populated when return: true
 */
export async function instanceUpdateRelationship<
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
  data: UpdateRelationshipData<RelatedNodesToAssociateI, Alias>,
  params: InstanceUpdateRelationshipParams<RelatedNodesToAssociateI, Alias>,
): Promise<
  UpdateRelationshipResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Alias
  >
> {
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'updateRelationship',
  );

  return ctx.Model.updateRelationship(data, {
    ...params,
    where: {
      ...params.where,
      source: {
        [primaryKeyField]: getInstanceProperty(instance, primaryKeyField),
      },
    },
  });
}
