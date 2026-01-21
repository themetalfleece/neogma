import type { Neo4jSupportedProperties } from '../../Queries';
import { QueryBuilder } from '../../Queries';
import type { NeogmaInstance } from '../model.types';
import type { RelationshipCrudContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import type { FindRelationshipsParams } from './findRelationships.types';

/**
 * Finds relationships matching the query.
 */
export async function findRelationships<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params: FindRelationshipsParams<Properties, RelatedNodesToAssociateI, Alias>,
): Promise<
  Array<{
    source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
    target: RelatedNodesToAssociateI[Alias]['Instance'];
    relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
  }>
> {
  const { alias, where, limit, skip, session, minHops, maxHops, order } =
    params;

  const identifiers = {
    source: 'source',
    target: 'target',
    relationship: 'relationship',
  };

  const relationship = ctx.getRelationshipByAlias(alias);
  const relationshipModel = ctx.getRelationshipModel(relationship.model);

  const queryBuilder = new QueryBuilder().match({
    related: [
      {
        model: ctx.Model,
        where: where?.source,
        identifier: identifiers.source,
      },
      {
        ...relationship,
        where: where?.relationship,
        identifier: identifiers.relationship,
        minHops,
        maxHops,
      },
      {
        label: relationshipModel.getLabel(),
        where: where?.target,
        identifier: identifiers.target,
      },
    ],
  });

  if (order) {
    queryBuilder.orderBy(
      order.map((o) => ({
        identifier: identifiers[o.on],
        direction: o.direction,
        property: o.property,
      })),
    );
  }

  queryBuilder.return(Object.values(identifiers));

  if (skip) {
    queryBuilder.skip(skip);
  }
  if (limit) {
    queryBuilder.limit(limit);
  }

  const res = await queryBuilder.run(ctx.queryRunner, session);

  return res.records.map((record) => ({
    source: ctx.buildFromRecord(record.get(identifiers.source)),
    target: relationshipModel.buildFromRecord(record.get(identifiers.target)),
    relationship: record.get(identifiers.relationship).properties,
  })) as Array<{
    source: NeogmaInstance<Properties, RelatedNodesToAssociateI, MethodsI>;
    target: RelatedNodesToAssociateI[Alias]['Instance'];
    relationship: RelatedNodesToAssociateI[Alias]['RelationshipProperties'];
  }>;
}
