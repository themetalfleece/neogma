import { QueryResult } from 'neo4j-driver';

import { QueryBuilder } from '../../QueryBuilder';
import { AnyWhereI, Where } from '../../Where/Where';
import { CreateRelationshipParamsI, Runnable } from '../QueryRunner.types';

export interface CreateRelationshipDeps {
  runQueryBuilder: (
    queryBuilder: QueryBuilder,
    session?: Runnable | null,
  ) => Promise<QueryResult>;
  defaultIdentifiers: {
    source: string;
    target: string;
  };
}

export const createRelationship = async (
  params: CreateRelationshipParamsI,
  deps: CreateRelationshipDeps,
): Promise<QueryResult> => {
  const { source, target, relationship } = params;
  const where = Where.acquire(params.where);

  const relationshipIdentifier = 'r';

  const identifiers = {
    source: source.identifier || deps.defaultIdentifiers.source,
    target: target.identifier || deps.defaultIdentifiers.target,
  };

  const queryBuilder = new QueryBuilder(
    /** the params of the relationship value */
    where?.getBindParam()?.clone(),
  );

  queryBuilder.match({
    multiple: [
      {
        identifier: identifiers.source,
        label: source.label,
      },
      {
        identifier: identifiers.target,
        label: target.label,
      },
    ],
  });

  if (where) {
    queryBuilder.where(where);
  }

  queryBuilder.create({
    related: [
      {
        identifier: identifiers.source,
      },
      {
        direction: relationship.direction,
        name: relationship.name,
        identifier: relationshipIdentifier,
      },
      {
        identifier: identifiers.target,
      },
    ],
  });

  const relationshipProperties = params.relationship.properties;
  if (relationshipProperties && Object.keys(relationshipProperties).length) {
    /** the relationship properties statement to be inserted into the final statement string */
    queryBuilder.set({
      identifier: relationshipIdentifier,
      properties: relationshipProperties,
    });
  }

  return deps.runQueryBuilder(queryBuilder, params.session);
};
