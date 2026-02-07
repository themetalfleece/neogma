import type { QueryResult } from 'neo4j-driver';

import type { Literal } from '../../Literal';
import { QueryBuilder } from '../../QueryBuilder';
import { escapeIfNeeded } from '../../utils/cypher';
import type { AnyWhereI } from '../../Where/Where';
import { Where } from '../../Where/Where';
import type {
  Neo4jSupportedTypes,
  Runnable,
  UpdateSupportedProperties,
} from '../QueryRunner.types';
import { isUpdateOperator, UpdateOp } from '../QueryRunner.types';

export interface UpdateParams<T extends UpdateSupportedProperties> {
  /** the label of the nodes to update */
  label?: string;
  /** the where object for matching the nodes to be edited */
  data: T;
  /** the new data data, to be edited */
  where?: AnyWhereI;
  /** identifier for the nodes */
  identifier?: string;
  /** whether to return the nodes */
  return?: boolean;
  /** the session or transaction for running this query */
  session?: Runnable | null;
}

export interface UpdateDeps {
  runQueryBuilder: (
    queryBuilder: QueryBuilder,
    session?: Runnable | null,
  ) => Promise<QueryResult>;
  defaultIdentifier: string;
}

export const update = async <T extends UpdateSupportedProperties>(
  params: UpdateParams<T>,
  deps: UpdateDeps,
): Promise<QueryResult> => {
  const { label } = params;

  const data = params.data;

  const identifier = params.identifier || deps.defaultIdentifier;

  const where = Where.acquire(params.where);

  const queryBuilder = new QueryBuilder(
    /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
    where?.getBindParam().clone(),
  );

  queryBuilder.match({
    identifier,
    label,
  });

  if (where) {
    queryBuilder.where(where);
  }

  for (const [property, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      const symbols = Object.getOwnPropertySymbols(value);
      for (const { description } of symbols) {
        const operator = description as 'remove';
        if (operator && isUpdateOperator[operator]?.(value)) {
          if (operator === 'remove' && value[UpdateOp[operator]] === true) {
            queryBuilder.remove({ identifier, properties: [property] });
          }
          delete data[property];
        }
      }
    }
  }

  queryBuilder.set({
    identifier,
    properties: data as Record<
      string,
      Neo4jSupportedTypes | Literal | undefined
    >,
  });

  if (params.return) {
    queryBuilder.return(escapeIfNeeded(identifier));
  }

  return deps.runQueryBuilder(queryBuilder, params.session);
};
