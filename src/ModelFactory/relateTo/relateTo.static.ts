import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import type { Neo4jSupportedProperties } from '../../QueryRunner';
import { QueryRunner } from '../../QueryRunner';
import type { WhereParamsByIdentifierI } from '../../Where';
import type { AnyObject } from '../shared.types';
import type {
  RelateToParams,
  RelateToResult,
  RelateToResultEntry,
  RelationshipCrudContext,
} from './relateTo.types';

export type { RelateToResult, RelateToResultEntry };

/**
 * Creates a relationship using the configuration specified in "relationships".
 * @returns A tuple of [relationships, count] where relationships is populated when return: true
 */
export async function relateTo<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
  MethodsI extends AnyObject,
  Alias extends keyof RelatedNodesToAssociateI,
>(
  ctx: RelationshipCrudContext<Properties, RelatedNodesToAssociateI, MethodsI>,
  params: RelateToParams<Properties, RelatedNodesToAssociateI, Alias>,
): Promise<
  RelateToResult<Properties, RelatedNodesToAssociateI, MethodsI, Alias>
> {
  const relationship = ctx.getRelationshipConfiguration(params.alias);
  const relationshipModel = ctx.getRelationshipModel(relationship.model);

  const relationshipProperties = ctx.getRelationshipProperties(
    relationship,
    params.properties || {},
  );

  const identifiers = QueryRunner.identifiers.createRelationship;

  const where: WhereParamsByIdentifierI = {};
  if (params.where) {
    where[identifiers.source] = params.where.source;
    where[identifiers.target] = params.where.target;
  }

  const res = await ctx.queryRunner.createRelationship({
    source: {
      label: ctx.getLabel(),
    },
    target: {
      label: relationshipModel.getLabel(),
    },
    relationship: {
      name: relationship.name,
      direction: relationship.direction,
      properties: relationshipProperties,
    },
    where,
    session: params.session,
    return: params.return,
  });

  const relationshipsCreated =
    res.summary.counters.updates().relationshipsCreated;

  if (params.throwIfNoneCreated && relationshipsCreated === 0) {
    throw new NeogmaNotFoundError('No relationships were created', {
      alias: String(params.alias),
    });
  }

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

  if (params.return) {
    const relationships = res.records.map((record) => ({
      source: ctx.buildFromRecord(record.get(identifiers.source)),
      target: relationshipModel.buildFromRecord(record.get(identifiers.target)),
      relationship: record.get(identifiers.relationship).properties,
    })) as Array<
      RelateToResultEntry<Properties, RelatedNodesToAssociateI, MethodsI, Alias>
    >;

    return [relationships, relationshipsCreated] as RelateToResult<
      Properties,
      RelatedNodesToAssociateI,
      MethodsI,
      Alias
    >;
  }

  return [[], relationshipsCreated] as RelateToResult<
    Properties,
    RelatedNodesToAssociateI,
    MethodsI,
    Alias
  >;
}
