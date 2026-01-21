import { randomUUID } from 'crypto';
import { Driver, QueryResult, SessionConfig } from 'neo4j-driver';

import { getRunnable } from '../../../Sessions';
import { trimWhitespace } from '../../../utils/string';
import { Runnable } from '../QueryRunner.types';

export interface RunDeps {
  driver: Driver;
  sessionParams?: SessionConfig;
  logger: null | ((...val: Array<string | boolean | object | number>) => any);
  sessionIdentifiers: WeakMap<Runnable, string>;
}

/** runs a statement */
export const run = (
  /** the statement to run */
  statement: string,
  /** parameters for the query */
  parameters: Record<string, any> | undefined,
  /** the session or transaction for running this query. Passing it will ignore the `sessionParams` passed to the constructor */
  existingSession: Runnable | null | undefined,
  deps: RunDeps,
): Promise<QueryResult> => {
  return getRunnable(
    existingSession,
    async (session) => {
      parameters = parameters || {};
      /** an identifier to be used for logging purposes */
      let sessionIdentifier = 'Default';
      const existingSessionIdentifier = deps.sessionIdentifiers.get(session);
      if (existingSessionIdentifier) {
        sessionIdentifier = existingSessionIdentifier;
      } else {
        sessionIdentifier = randomUUID();
        deps.sessionIdentifiers.set(session, sessionIdentifier);
      }

      const trimmedStatement = trimWhitespace(statement);
      const messageToLog = [
        sessionIdentifier,
        trimmedStatement,
        JSON.stringify(parameters),
      ].join(' ** ');
      deps.logger?.(messageToLog);
      return session.run(trimmedStatement, parameters);
    },
    deps.driver,
    deps.sessionParams,
  );
};
