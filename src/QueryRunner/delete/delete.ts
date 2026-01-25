import type { QueryResult } from 'neo4j-driver';

import { QueryBuilder } from '../../QueryBuilder';
import type { AnyWhereI } from '../../Where/Where';
import { Where } from '../../Where/Where';
import type { Runnable } from '../QueryRunner.types';

export interface DeleteParams {
  label?: string;
  where?: AnyWhereI;
  identifier?: string;
  /** detach relationships */
  detach?: boolean;
  /** the session or transaction for running this query */
  session?: Runnable | null;
}

export interface DeleteDeps {
  runQueryBuilder: (
    queryBuilder: QueryBuilder,
    session?: Runnable | null,
  ) => Promise<QueryResult>;
  defaultIdentifier: string;
}

export const deleteNodes = async (
  params: DeleteParams,
  deps: DeleteDeps,
): Promise<QueryResult> => {
  const { label, detach } = params;
  const where = Where.acquire(params.where);

  const identifier = params.identifier || deps.defaultIdentifier;

  const queryBuilder = new QueryBuilder(where?.getBindParam());

  queryBuilder.match({
    identifier,
    label,
  });

  if (where) {
    queryBuilder.where(where);
  }

  queryBuilder.delete({
    identifiers: identifier,
    detach,
  });

  return deps.runQueryBuilder(queryBuilder, params.session);
};
