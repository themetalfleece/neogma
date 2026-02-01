import type { QueryResult } from 'neo4j-driver';

import { QueryBuilder } from '../../QueryBuilder';
import { Where } from '../../Where/Where';
import type { CreateRelationshipParamsI, Runnable } from '../QueryRunner.types';

export interface CreateRelationshipDeps {
  runQueryBuilder: (
    queryBuilder: QueryBuilder,
    session?: Runnable | null,
  ) => Promise<QueryResult>;
  defaultIdentifiers: {
    source: string;
    target: string;
    relationship: string;
  };
}

export const createRelationship = async <Return extends boolean = false>(
  params: CreateRelationshipParamsI<Return>,
  deps: CreateRelationshipDeps,
): Promise<QueryResult> => {
  const { source, target, relationship } = params;
  const where = Where.acquire(params.where);

  const identifiers = {
    source: source.identifier || deps.defaultIdentifiers.source,
    target: target.identifier || deps.defaultIdentifiers.target,
    relationship: deps.defaultIdentifiers.relationship,
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
        identifier: identifiers.relationship,
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
      identifier: identifiers.relationship,
      properties: relationshipProperties,
    });
  }

  if (params.return) {
    queryBuilder.return([
      identifiers.source,
      identifiers.target,
      identifiers.relationship,
    ]);
  }

  return deps.runQueryBuilder(queryBuilder, params.session);
};
