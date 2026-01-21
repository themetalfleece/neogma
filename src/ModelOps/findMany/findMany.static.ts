import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../Queries';
import { BindParam } from '../../Queries/BindParam/BindParam';
import { QueryBuilder } from '../../Queries/QueryBuilder';
import { Where } from '../../Queries/Where';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type { FindContext, FindManyParams } from './findMany.types';

/**
 * Finds multiple nodes matching the query.
 */
export async function findMany<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params?: FindManyParams<Properties> & { plain?: Plain },
): Promise<
  Plain extends true
    ? Properties[]
    : Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>
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

  queryBuilder.return(rootIdentifier);

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

  if (params?.skip) {
    queryBuilder.skip(+params.skip);
  }

  if (params?.limit) {
    queryBuilder.limit(+params.limit);
  }

  const res = await queryBuilder.run(ctx.queryRunner, params?.session);

  let returnData:
    | Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>
    | Properties[] = [];

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

  return returnData as Plain extends true
    ? Properties[]
    : Array<NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>>;
}
