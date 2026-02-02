import { getSetParts } from '../getSetParts';
import type {
  GetOnMatchSetStringDeps,
  GetOnMatchSetStringSet,
} from './getOnMatchSetString.types';

/**
 * Returns a string in the format: `ON MATCH SET a.p1 = $v1, a.p2 = $v2`
 *
 * Used with MERGE statements to specify properties to set when an existing node is matched.
 *
 * @example
 * // Using a literal string
 * const result = getOnMatchSetString('n.accessCount = n.accessCount + 1', deps);
 * // Returns: "ON MATCH SET n.accessCount = n.accessCount + 1"
 *
 * @example
 * // Using an object with identifier and properties
 * const result = getOnMatchSetString({
 *   identifier: 'n',
 *   properties: { lastAccessed: new Date().toISOString(), accessCount: 5 }
 * }, deps);
 * // Returns: "ON MATCH SET n.lastAccessed = $lastAccessed, n.accessCount = $accessCount"
 *
 * @param set - The ON MATCH SET parameters (string or object)
 * @param deps - Dependencies including bindParam for parameter binding
 * @returns The formatted ON MATCH SET clause string
 */
export const getOnMatchSetString = (
  set: GetOnMatchSetStringSet,
  deps: GetOnMatchSetStringDeps,
): string => {
  if (typeof set === 'string') {
    return `ON MATCH SET ${set}`;
  }

  const setPartsResult = getSetParts({
    data: set.properties,
    identifier: set.identifier,
    bindParam: deps.bindParam,
  });

  if (!setPartsResult.parts.length) {
    return '';
  }

  return `ON MATCH ${setPartsResult.statement}`;
};
