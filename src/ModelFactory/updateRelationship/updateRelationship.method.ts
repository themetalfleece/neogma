import type { QueryResult } from 'neo4j-driver';

import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { InstanceRelationshipContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import type { InstanceUpdateRelationshipParams } from './updateRelationship.types';

/**
 * Updates relationship properties from this instance to target nodes.
 */
export async function instanceUpdateRelationship<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>,
  ctx: InstanceRelationshipContext<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI
  >,
  data: AnyObject,
  params: InstanceUpdateRelationshipParams<RelatedNodesToAssociateI>,
): Promise<QueryResult> {
  const primaryKeyField = ctx.assertPrimaryKeyField(
    ctx.primaryKeyField,
    'updateRelationship',
  );

  return ctx.Model.updateRelationship(data, {
    ...params,
    where: {
      ...params.where,
      source: {
        [primaryKeyField]: (instance as any)[primaryKeyField],
      },
    },
  });
}
