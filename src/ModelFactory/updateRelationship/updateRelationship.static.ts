import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { Where } from '../../Where';
import type { RelationshipCrudContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import type {
  UpdateRelationshipData,
  UpdateRelationshipParams,
  UpdateRelationshipResult,
  UpdateRelationshipResultEntry,
} from './updateRelationship.types';

export type { UpdateRelationshipResult, UpdateRelationshipResultEntry };

/**
 * Updates relationship properties.
 * @returns A tuple of [relationships, QueryResult] where relationships is populated when return: true
 */
export async function updateRelationship<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: UpdateRelationshipData<RelatedNodesToAssociateI, Alias>,
  params: UpdateRelationshipParams<Properties, RelatedNodesToAssociateI, Alias>,
): Promise<
  UpdateRelationshipResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Alias
  >
> {
  const relationship = ctx.getRelationshipConfiguration(params.alias);
  const relationshipModel = ctx.getRelationshipModel(relationship.model);

  const identifiers = {
    source: 'source',
    target: 'target',
    relationship: 'r',
  };
  const labels = {
    source: ctx.getLabel(),
    target: relationshipModel.getLabel(),
  };

  const where: Where = new Where({});
  if (params.where?.source) {
    where.addParams({ [identifiers.source]: params.where.source });
  }
  if (params.where?.target) {
    where.addParams({ [identifiers.target]: params.where.target });
  }
  if (params.where?.relationship) {
    where.addParams({
      [identifiers.relationship]: params.where.relationship,
    });
  }

  const queryBuilder = new QueryBuilder(where.getBindParam().clone());

  queryBuilder.match({
    related: [
      {
        identifier: identifiers.source,
        label: labels.source,
      },
      {
        direction: relationship.direction,
        name: relationship.name,
        identifier: identifiers.relationship,
      },
      {
        identifier: identifiers.target,
        label: labels.target,
      },
    ],
  });

  if (where) {
    queryBuilder.where(where);
  }

  queryBuilder.set({
    properties: data,
    identifier: identifiers.relationship,
  });

  if (params.return) {
    queryBuilder.return([
      identifiers.source,
      identifiers.target,
      identifiers.relationship,
    ]);
  }

  const res = await queryBuilder.run(ctx.queryRunner, params.session);

  if (
    params.throwIfNoneUpdated &&
    res.summary.counters.updates().propertiesSet === 0
  ) {
    throw new NeogmaNotFoundError('No relationships were updated', {
      alias: String(params.alias),
    });
  }

  if (params.return) {
    const relationships = res.records.map((record) => ({
      source: ctx.buildFromRecord(record.get(identifiers.source)),
      target: relationshipModel.buildFromRecord(record.get(identifiers.target)),
      relationship: record.get(identifiers.relationship).properties,
    })) as Array<
      UpdateRelationshipResultEntry<
        Properties,
        RelatedNodesToAssociateI,
        MethodsI,
        Alias
      >
    >;

    return [relationships, res] as UpdateRelationshipResult<
      Properties,
      RelatedNodesToAssociateI,
      MethodsI,
      Alias
    >;
  }

  return [[], res] as UpdateRelationshipResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Alias
  >;
}
