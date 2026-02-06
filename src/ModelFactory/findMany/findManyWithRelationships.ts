import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import { buildEagerLoadQuery } from './buildEagerLoadQuery';
import type { FindManyWithRelationshipsResult } from './eagerLoading.types';
import type { FindContext, FindManyParams } from './findMany.types';
import { hydrateEagerResult } from './hydrateEagerResult';
import { toPlainWithRelationships } from './toPlainWithRelationships';

/**
 * Finds multiple nodes with eager loading of relationships.
 * Uses CALL subqueries to fetch all related data in a single query.
 * Supports `plain: true` to return plain objects with relationships.
 *
 * @example
 * ```typescript
 * const users = await findManyWithRelationships(ctx, {
 *   where: { status: 'active' },
 *   relationships: {
 *     Orders: {
 *       where: { target: { status: 'completed' } },
 *       limit: 10
 *     }
 *   }
 * });
 * ```
 */
export async function findManyWithRelationships<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Plain extends boolean = false,
>(
  ctx: FindContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params: FindManyParams<Properties, RelatedNodesToAssociateI> & {
    relationships: NonNullable<
      FindManyParams<Properties, RelatedNodesToAssociateI>['relationships']
    >;
    plain?: Plain;
  },
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

  // Validate that the context has the required methods for eager loading
  if (!ctx.getRelationshipByAlias || !ctx.getRelationshipModel) {
    throw new Error(
      'Context is missing getRelationshipByAlias or getRelationshipModel for eager loading',
    );
  }

  const { statement, bindParams, relationshipLevels } = buildEagerLoadQuery({
    rootLabel: label,
    rootIdentifier,
    rootWhere: params.where,
    rootOrder: params.order,
    rootLimit: params.limit,
    rootSkip: params.skip,
    relationships: params.relationships,
    ctx: {
      queryRunner: ctx.queryRunner,
      modelName: ctx.modelName,
      getLabel: ctx.getLabel,
      buildFromRecord: ctx.buildFromRecord,
      getRelationshipByAlias: ctx.getRelationshipByAlias,
      getRelationshipModel: ctx.getRelationshipModel,
    },
  });

  const result = await ctx.queryRunner.run(
    statement,
    bindParams,
    params.session,
  );

  if (params.throwIfNoneFound && result.records.length === 0) {
    throw new NeogmaNotFoundError('No nodes were found', {
      label: ctx.getLabel(),
    });
  }

  const instances = result.records.map((record) => {
    return hydrateEagerResult({
      record,
      rootIdentifier,
      relationshipLevels,
      ctx: {
        queryRunner: ctx.queryRunner,
        modelName: ctx.modelName,
        getLabel: ctx.getLabel,
        buildFromRecord: ctx.buildFromRecord,
        getRelationshipByAlias: ctx.getRelationshipByAlias!,
        getRelationshipModel: ctx.getRelationshipModel!,
      },
    });
  });

  type Result = FindManyWithRelationshipsResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Plain
  >;

  // If plain mode, convert instances to plain objects with relationships
  if (params.plain) {
    return instances.map((instance) =>
      toPlainWithRelationships(
        instance as NeogmaInstance<Properties, AnyObject, AnyObject>,
        relationshipLevels,
      ),
    ) as Result;
  }

  return instances as Result;
}
