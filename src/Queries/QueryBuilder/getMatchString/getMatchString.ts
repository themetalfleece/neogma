import { NeogmaConstraintError } from '../../../Errors';
import { getNodeString } from '../getNodeString';
import { getRelationshipString } from '../getRelationshipString';
import {
  isMatchLiteral,
  isMatchMultiple,
  isMatchRelated,
  isRelationship,
} from '../QueryBuilder.types';
import { GetMatchStringDeps, GetMatchStringMatch } from './getMatchString.types';

/** Returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
export const getMatchString = (
  match: GetMatchStringMatch,
  deps: GetMatchStringDeps,
): string => {
  if (typeof match === 'string') {
    return `MATCH ${match}`;
  }

  if (isMatchMultiple(match)) {
    return [
      match.optional ? 'OPTIONAL' : '',
      'MATCH',
      match.multiple.map((element) => getNodeString(element, deps)).join(', '),
    ].join(' ');
  }

  if (isMatchRelated(match)) {
    // every even element is a node, every odd element is a relationship
    const parts: string[] = [];

    for (let index = 0; index < match.related.length; index++) {
      const element = match.related[index];
      if (index % 2) {
        // even, parse as relationship
        if (!isRelationship(element)) {
          throw new NeogmaConstraintError(
            'even argument of related is not a relationship',
          );
        }
        parts.push(getRelationshipString(element, deps));
      } else {
        // odd, parse as node
        parts.push(getNodeString(element, deps));
      }
    }

    return [match.optional ? 'OPTIONAL' : '', 'MATCH', parts.join('')].join(
      ' ',
    );
  }

  if (isMatchLiteral(match)) {
    return [
      match.optional ? 'OPTIONAL' : '',
      `MATCH ${getNodeString(match.literal, deps)}`,
    ].join(' ');
  }

  // else, is a node
  return [
    match.optional ? 'OPTIONAL' : '',
    `MATCH ${getNodeString(match, deps)}`,
  ].join(' ');
};
