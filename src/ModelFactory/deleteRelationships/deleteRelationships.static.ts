import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { QueryBuilder } from '../../QueryBuilder';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { QueryRunner } from '../../QueryRunner';
import type { RelationshipCrudContext } from '../relateTo/relateTo.types';
import type { AnyObject } from '../shared.types';
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
  params: DeleteRelationshipsParams<
    Properties,
    RelatedNodesToAssociateI,
    Alias
  >,
): Promise<number> {
  const { alias, where, session } = params;

  if (!where) {
    throw new NeogmaConstraintError(
      '`where` param is required for deleteRelationships',
    );
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
