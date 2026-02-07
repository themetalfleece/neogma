import { BindParam } from '../../BindParam/BindParam';
import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { escapeIfNeeded } from '../../utils/cypher';
import { Where } from '../../Where';
import type { AnyObject } from '../shared.types';
import type { FindManyWithRelationshipsResult } from './eagerLoading.types';
import type { FindContext, FindManyParams } from './findMany.types';

/**
 * Finds multiple nodes without eager loading.
 * Standard query that returns nodes matching the criteria.
 *
 * @example
 * ```typescript
 * const users = await findManyStandard(ctx, {
 *   where: { status: 'active' },
 *   order: [['name', 'ASC']],
 *   limit: 10
 * });
 * ```
 */
export async function findManyStandard<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params?: Omit<
    FindManyParams<Properties, RelatedNodesToAssociateI>,
    'relationships'
  > & { plain?: Plain },
): Promise<
  FindManyWithRelationshipsResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Plain
  >
> {
  const label = ctx.getLabel();
  const rootIdentifier = ctx.modelName;

  const bindParam = new BindParam();
  const rootWhere =
    params?.where &&
    new Where(
      {
        [rootIdentifier]: params?.where,
      },
      bindParam,
    );

  const queryBuilder = new QueryBuilder(bindParam);

  queryBuilder.match({
    identifier: rootIdentifier,
    label,
  });

  if (rootWhere) {
    queryBuilder.where(rootWhere);
  }

  queryBuilder.return(escapeIfNeeded(rootIdentifier));

  if (params?.order) {
    queryBuilder.orderBy(
      params.order
        .filter(([field]) => ctx.schemaKeys.has(field))
        .map(([property, direction]) => ({
          identifier: rootIdentifier,
          direction,
          property,
        })),
    );
  }

  if (params?.skip !== undefined) {
    queryBuilder.skip(params.skip);
  }

  if (params?.limit !== undefined) {
    queryBuilder.limit(params.limit);
  }

  const res = await queryBuilder.run(ctx.queryRunner, params?.session);

  type Result = FindManyWithRelationshipsResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Plain
  >;

  let returnData: Result = [];

  if (params?.plain) {
    returnData = res.records.map(
      (record) => record.get(rootIdentifier).properties,
    );
  } else {
    returnData = res.records.map((record) => {
      const instance = ctx.buildFromRecord(record.get(rootIdentifier));
      instance.__existsInDatabase = true;
      return instance;
    });
  }

  if (params?.throwIfNoneFound && !returnData.length) {
    throw new NeogmaNotFoundError(`No node was found`, {
      label: ctx.getLabel(),
    });
  }

  return returnData;
}
