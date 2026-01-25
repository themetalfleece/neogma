import type { QueryResult } from 'neo4j-driver';

import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { Where } from '../../Where';
import type { RelationshipCrudContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
import type { UpdateRelationshipParams } from './updateRelationship.types';

/**
 * Updates relationship properties.
 */
export async function updateRelationship<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  data: AnyObject,
  params: UpdateRelationshipParams<Properties, RelatedNodesToAssociateI, Alias>,
): Promise<QueryResult> {
  const relationship = ctx.getRelationshipConfiguration(params.alias);

  const identifiers = {
    source: 'source',
    target: 'target',
    relationship: 'r',
  };
  const labels = {
    source: ctx.getLabel(),
    target: ctx.getRelationshipModel(relationship.model).getLabel(),
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

  return queryBuilder.run(ctx.queryRunner, params.session);
}
