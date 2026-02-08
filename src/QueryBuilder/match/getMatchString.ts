import { NeogmaConstraintError } from '../../Errors';
import type { Where } from '../../Where';
import { getNodeString } from '../nodeString';
import type { GetNodeStringResult } from '../nodeString/getNodeString.types';
import { getRelationshipString } from '../relationshipString';
import type { GetRelationshipStringResult } from '../relationshipString/getRelationshipString.types';
import { isRelationship } from '../shared';
import { assertMatchValue } from './assertMatchValue';
import type {
  GetMatchStringDeps,
  GetMatchStringMatch,
} from './getMatchString.types';
import {
  isMatchLiteral,
  isMatchMultiple,
  isMatchRelated,
} from './isMatchParameter';

/**
 * Appends WHERE clause from standalone Where instances to the match statement.
 * Combines multiple Where statements using AND.
 */
const appendWhereClause = (
  matchPart: string,
  standaloneWheres: Where[],
): string => {
  if (standaloneWheres.length === 0) {
    return matchPart;
  }

  // Combine all WHERE statements with AND
  const whereStatements = standaloneWheres
    .map((w) => w.getStatement('text'))
    .filter((s) => s.length > 0);

  if (whereStatements.length === 0) {
    return matchPart;
  }

  return `${matchPart} WHERE ${whereStatements.join(' AND ')}`;
};

/**
 * Returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1`.
 *
 * **SECURITY WARNING**: String parameters are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use the object
 * format with `identifier`, `label`, and `where` for safe queries.
 *
 * @example
 * // SAFE: Object format - identifier and label are validated, where uses BindParam
 * getMatchString({ identifier: 'n', label: 'User', where: { name: 'John' } }, deps);
 * // => "MATCH (n:User) WHERE n.name = $name"
 *
 * @example
 * // SAFE: Related format - nodes and relationships use validated identifiers
 * getMatchString({ related: [{ identifier: 'a' }, { direction: 'out' }, { identifier: 'b' }] }, deps);
 * // => "MATCH (a)-->(b)"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getMatchString('(n:User)-[:KNOWS]->(m:User)', deps);
 * // => "MATCH (n:User)-[:KNOWS]->(m:User)"
 */
export const getMatchString = (
  match: GetMatchStringMatch,
  deps: GetMatchStringDeps,
): string => {
  assertMatchValue(match);

  // String input: escape hatch for complex patterns - no validation
  if (typeof match === 'string') {
    return `MATCH ${match}`;
  }

  const statements: string[] = [];
  const standaloneWheres: Where[] = [];

  /**
   * Collects the statement and standalone WHERE clause from a result.
   * Uses closure to access statements and standaloneWheres arrays.
   */
  const collectResult = (
    result: GetNodeStringResult | GetRelationshipStringResult,
  ): void => {
    statements.push(result.statement);
    if (result.standaloneWhere) {
      standaloneWheres.push(result.standaloneWhere);
    }
  };

  if (isMatchMultiple(match)) {
    for (const element of match.multiple) {
      collectResult(getNodeString(element, deps));
    }

    const matchPart = [
      match.optional ? 'OPTIONAL' : '',
      'MATCH',
      statements.join(', '),
    ].join(' ');

    return appendWhereClause(matchPart, standaloneWheres);
  }

  if (isMatchRelated(match)) {
    // every even element is a node, every odd element is a relationship
    for (let index = 0; index < match.related.length; index++) {
      const element = match.related[index];
      if (index % 2) {
        // odd index = relationship
        if (!isRelationship(element)) {
          throw new NeogmaConstraintError(
            'odd argument of related is not a relationship',
          );
        }
        collectResult(getRelationshipString(element, deps));
      } else {
        // even index = node
        collectResult(getNodeString(element, deps));
      }
    }

    const matchPart = [
      match.optional ? 'OPTIONAL' : '',
      'MATCH',
      statements.join(''),
    ].join(' ');

    return appendWhereClause(matchPart, standaloneWheres);
  }

  if (isMatchLiteral(match)) {
    collectResult(getNodeString(match.literal, deps));

    const matchPart = [
      match.optional ? 'OPTIONAL' : '',
      `MATCH ${statements[0]}`,
    ].join(' ');

    return appendWhereClause(matchPart, standaloneWheres);
  }

  // else, is a node
  collectResult(getNodeString(match, deps));

  const matchPart = [
    match.optional ? 'OPTIONAL' : '',
    `MATCH ${statements[0]}`,
  ].join(' ');

  return appendWhereClause(matchPart, standaloneWheres);
};
