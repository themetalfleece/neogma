import type { QueryResult } from 'neo4j-driver';

import { QueryBuilder } from '../../QueryBuilder';
import type { Runnable } from '../QueryRunner.types';

export interface CreateParams<T> {
  /** the label of the nodes to create */
  label: string;
  /** the data to create */
  data: T[];
  /** identifier for the nodes */
  identifier?: string;
  /** the session or transaction for running this query */
  session?: Runnable | null;
}

export interface CreateDeps {
  run: (
    statement: string,
    parameters?: Record<string, any>,
    session?: Runnable | null,
  ) => Promise<QueryResult>;
  defaultIdentifier: string;
}

export const create = async <T>(
  params: CreateParams<T>,
  deps: CreateDeps,
): Promise<QueryResult> => {
  const { label, data: options } = params;
  const identifier = params.identifier || deps.defaultIdentifier;

  const queryBuilder = new QueryBuilder()
    .unwind('$options as data')
    .create({
      identifier,
      label,
    })
    .set(`${identifier} += data`)
    .return(identifier);

  // we won't use the queryBuilder bindParams as we've used "options" as a literal
  const parameters = { options };

  return deps.run(queryBuilder.getStatement(), parameters, params.session);
};
