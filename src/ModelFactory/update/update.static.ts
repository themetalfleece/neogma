import type { QueryResult } from 'neo4j-driver';

import type { Neo4jSupportedProperties } from '../../Queries';
import type { NeogmaInstance, UpdateDataI } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { UpdateContext, UpdateParams } from './update.types';

/**
 * Updates nodes matching the query.
 */
export async function update<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
>(
  ctx: UpdateContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: UpdateDataI<Properties>,
  params?: UpdateParams,
): Promise<
  [
    Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>,
    QueryResult,
  ]
> {
  const label = ctx.getLabel();
  const identifier = 'node';

  const where = params?.where
    ? {
        [identifier]: params.where,
      }
    : undefined;

  const res = await ctx.queryRunner.update({
    label,
    data,
    where,
    identifier,
    return: params?.return,
    session: params?.session,
  });

  const instances = res.records.map((record) =>
    ctx.buildFromRecord(record.get(identifier)),
  );

  return [instances, res] as [
    Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>,
    QueryResult,
  ];
}
