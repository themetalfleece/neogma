import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { QueryRunner } from '../../QueryRunner';
import type { WhereParamsByIdentifierI } from '../../Where';
import type { AnyObject } from '../shared.types';
import type { RelateToParams, RelationshipCrudContext } from './relateTo.types';

/**
 * Creates a relationship using the configuration specified in "relationships".
 */
export async function relateTo<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params: RelateToParams<Properties, RelatedNodesToAssociateI, Alias>,
): Promise<number> {
  const relationship = ctx.getRelationshipConfiguration(params.alias);

  const where: WhereParamsByIdentifierI = {};
  if (params.where) {
    where[QueryRunner.identifiers.createRelationship.source] =
      params.where.source;
    where[QueryRunner.identifiers.createRelationship.target] =
      params.where.target;
  }

  const relationshipProperties = ctx.getRelationshipProperties(
    relationship,
    params.properties || {},
  );

  const res = await ctx.queryRunner.createRelationship({
    source: {
      label: ctx.getLabel(),
    },
    target: {
      label: ctx.getRelationshipModel(relationship.model).getLabel(),
    },
    relationship: {
      name: relationship.name,
      direction: relationship.direction,
      properties: relationshipProperties,
    },
    where,
    session: params.session,
  });

  const relationshipsCreated =
    res.summary.counters.updates().relationshipsCreated;

  const { assertCreatedRelationships } = params;
  if (
    assertCreatedRelationships &&
    relationshipsCreated !== assertCreatedRelationships
  ) {
    throw new NeogmaConstraintError(
      'Not all required relationships were created',
      {
        actual: { relationshipsCreated },
        expected: { assertCreatedRelationships },
      },
    );
  }

  return relationshipsCreated;
}
