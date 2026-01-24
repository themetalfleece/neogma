import { QueryRunner } from '../../QueryRunner';
import type { DeleteContext, DeleteParams } from './delete.types';

/**
 * Deletes nodes matching the query.
 * Returns the count of deleted nodes.
 */
export async function deleteNodes(
  ctx: DeleteContext,
  configuration?: DeleteParams,
): Promise<number> {
  const detach = configuration?.detach;
  const whereParams = configuration?.where;

  const label = ctx.getLabel();

  const identifier = 'node';
  const res = await ctx.queryRunner.delete({
    label,
    where: whereParams && {
      [identifier]: whereParams,
    },
    detach,
    identifier,
    session: configuration?.session,
  });

  return QueryRunner.getNodesDeleted(res);
}
