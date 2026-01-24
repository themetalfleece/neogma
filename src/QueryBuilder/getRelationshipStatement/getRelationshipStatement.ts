import { Where } from '../../Where';
import { getIdentifierWithLabel } from '../getIdentifierWithLabel';
import { getPropertiesWithParams } from '../getPropertiesWithParams';
import { getVariableLengthRelationshipString } from '../getVariableLengthRelationshipString';
import { GetRelationshipStatementParams } from './getRelationshipStatement.types';

/**
 * Returns the appropriate string for a relationship, ready to be put in a statement
 * Example: -[identifier:name*minHops..maxHops {where}]->
 */
export const getRelationshipStatement = (
  params: GetRelationshipStatementParams,
): string => {
  const { direction, name, inner, minHops, maxHops } = params;
  const identifier = params.identifier || '';

  const allParts: string[] = [];

  // <- or -
  allParts.push(direction === 'in' ? '<-' : '-');

  // Build the inner relationship content
  // identifier:Name and variableLength are joined without space
  // inner (where/properties) is separated by space
  let innerContent = '';

  // identifier:Name
  if (identifier || name) {
    innerContent += getIdentifierWithLabel(identifier, name);
  }

  const variableLength = getVariableLengthRelationshipString({
    minHops,
    maxHops,
  });

  if (variableLength) {
    innerContent += variableLength;
  }

  if (inner) {
    let innerStr: string;
    if (typeof inner === 'string') {
      innerStr = inner;
    } else if (inner instanceof Where) {
      innerStr = inner.getStatement('object');
    } else {
      innerStr = getPropertiesWithParams(inner.properties, inner.bindParam);
    }
    // Add space before inner content if there's already content
    if (innerContent) {
      innerContent += ' ' + innerStr;
    } else {
      innerContent = innerStr;
    }
  }

  // wrap it in [ ]
  allParts.push(`[${innerContent}]`);

  // -> or -
  allParts.push(direction === 'out' ? '->' : '-');

  return allParts.join('');
};
