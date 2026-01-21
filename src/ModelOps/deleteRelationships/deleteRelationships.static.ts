import { NeogmaError } from '../../Errors/NeogmaError';
import { QueryBuilder } from '../../Queries';
import { QueryRunner } from '../../Queries/QueryRunner';
import type { Neo4jSupportedProperties } from '../../Queries';
import type { AnyObject } from '../shared.types';
import type { RelationshipCrudContext } from '../relateTo/relateTo.types';
import type { DeleteRelationshipsParams } from './deleteRelationships.types';

/**
 * Deletes relationships matching the query.
 */
export async function deleteRelationships<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params: DeleteRelationshipsParams<RelatedNodesToAssociateI, Alias>,
): Promise<number> {
  const { alias, where, session } = params;

  if (!where) {
    throw new NeogmaError('`where` param was not given to deleteRelationships');
  }

  const identifiers = {
    source: 'source',
    target: 'target',
    relationship: 'relationship',
  };

  const relationship = ctx.getRelationshipByAlias(alias);
  const relationshipModel = ctx.getRelationshipModel(relationship.model);

  const queryBuilder = new QueryBuilder()
    .match({
      related: [
        {
          model: ctx.Model,
          where: where.source,
          identifier: identifiers.source,
        },
        {
          ...relationship,
          where: where.relationship,
          identifier: identifiers.relationship,
        },
        {
          label: relationshipModel.getLabel(),
          where: where.target,
          identifier: identifiers.target,
        },
      ],
    })
    .delete({
      identifiers: identifiers.relationship,
    });

  const res = await queryBuilder.run(ctx.queryRunner, session);

  return QueryRunner.getRelationshipsDeleted(res);
}
