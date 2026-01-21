import { QueryResult } from 'neo4j-driver';

export const getResultProperties = <T>(
  result: QueryResult,
  identifier: string,
): T[] => {
  return result.records.map((v) => v.get(identifier).properties);
};

export const getNodesDeleted = (result: QueryResult): number => {
  return result.summary.counters.updates().nodesDeleted;
};

export const getRelationshipsDeleted = (result: QueryResult): number => {
  return result.summary.counters.updates().relationshipsDeleted;
};
