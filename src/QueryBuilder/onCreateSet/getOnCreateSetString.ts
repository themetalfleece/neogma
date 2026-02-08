import { assertOnCreateSetValue } from '../QueryBuilder.types';
import { getSetParts } from '../setParts';
import type {
  GetOnCreateSetStringDeps,
  GetOnCreateSetStringSet,
} from './getOnCreateSetString.types';

/**
 * Returns a string in the format: `ON CREATE SET a.p1 = $v1, a.p2 = $v2`
 *
 * Used with MERGE statements to specify properties to set when a new node is created.
 *
 * @example
 * // Using a literal string
 * const result = getOnCreateSetString('n.created = timestamp()', deps);
 * // Returns: "ON CREATE SET n.created = timestamp()"
 *
 * @example
 * // Using an object with identifier and properties
 * const result = getOnCreateSetString({
 *   identifier: 'n',
 *   properties: { created: new Date().toISOString(), status: 'new' }
 * }, deps);
 * // Returns: "ON CREATE SET n.created = $created, n.status = $status"
 *
 * @param set - The ON CREATE SET parameters (string or object)
 * @param deps - Dependencies including bindParam for parameter binding
 * @returns The formatted ON CREATE SET clause string
 */
export const getOnCreateSetString = (
  set: GetOnCreateSetStringSet,
  deps: GetOnCreateSetStringDeps,
): string => {
  assertOnCreateSetValue(set);

  if (typeof set === 'string') {
    return `ON CREATE SET ${set}`;
  }

  const setPartsResult = getSetParts({
    data: set.properties,
    identifier: set.identifier,
    bindParam: deps.bindParam,
  });

  if (!setPartsResult.parts.length) {
    return '';
  }

  return `ON CREATE ${setPartsResult.statement}`;
};
