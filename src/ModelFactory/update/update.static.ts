import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { UpdateDataI } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { UpdateContext, UpdateParams, UpdateResult } from './update.types';

export type { UpdateResult };

/**
 * Updates nodes matching the query.
 * @returns A tuple of [instances, QueryResult] where instances is populated when return: true
 */
export async function update<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Return extends boolean = false,
>(
  ctx: UpdateContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: UpdateDataI<Properties>,
  params?: UpdateParams<Properties> & { return?: Return },
): Promise<
  UpdateResult<Properties, RelatedNodesToAssociateI, MethodsI, Return>
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

  if (params?.return) {
    const instances = res.records.map((record) =>
      ctx.buildFromRecord(record.get(identifier)),
    );

    return [instances, res] as UpdateResult<
      Properties,
      RelatedNodesToAssociateI,
      MethodsI,
      Return
    >;
  }

  return [[], res] as UpdateResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Return
  >;
}
