/**
 * Returns the inner part of a relationship given the min and max hops. It doesn't include the brackets ([])
 * Example: minHops = 1, maxHops = 2 -> "*1..2"
 *
 * https://neo4j.com/docs/cypher-manual/current/patterns/reference/#variable-length-relationships-rules
 */
export const getVariableLengthRelationshipString = ({
  minHops,
  maxHops,
}: {
  minHops?: number | undefined;
  maxHops?: number | undefined;
}): string | null => {
  // infinity: *
  if (minHops === Infinity || maxHops === Infinity) {
    return '*';
  }

  // only min hops: *m..
  if (typeof minHops === 'number' && typeof maxHops !== 'number') {
    return `*${minHops}..`;
  }

  // only max hops: *..n
  if (typeof minHops !== 'number' && typeof maxHops === 'number') {
    return `*..${maxHops}`;
  }

  // both: *m..n
  if (typeof minHops === 'number' && typeof maxHops === 'number') {
    if (minHops === maxHops) {
      // exactly: *m
      return `*${minHops}`;
    }
    return `*${minHops}..${maxHops}`;
  }

  return null;
};
