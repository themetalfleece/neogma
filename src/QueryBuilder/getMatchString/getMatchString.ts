import { NeogmaConstraintError } from '../../Errors';
import { Where } from '../../Where';
import { getNodeString } from '../getNodeString';
import { GetNodeStringResult } from '../getNodeString/getNodeString.types';
import { getRelationshipString } from '../getRelationshipString';
import { GetRelationshipStringResult } from '../getRelationshipString/getRelationshipString.types';
import {
  isMatchLiteral,
  isMatchMultiple,
  isMatchRelated,
  isRelationship,
} from '../QueryBuilder.types';
import {
  GetMatchStringDeps,
  GetMatchStringMatch,
} from './getMatchString.types';

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

/** Returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
export const getMatchString = (
  match: GetMatchStringMatch,
  deps: GetMatchStringDeps,
): string => {
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
