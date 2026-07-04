import type { QueryResult } from 'neo4j-driver';

export const getResultProperties = <T>(
  result: QueryResult,
  identifier: string,
): T[] => {
  return result.records.map((v) => v.get(identifier).properties);
};

/**
 * @deprecated Use `result.summary.counters.updates().nodesDeleted` directly.
 */
export const getNodesDeleted = (result: QueryResult): number => {
  return result.summary.counters.updates().nodesDeleted;
};

/**
 * @deprecated Use `result.summary.counters.updates().relationshipsDeleted` directly.
 */
export const getRelationshipsDeleted = (result: QueryResult): number => {
  return result.summary.counters.updates().relationshipsDeleted;
};
