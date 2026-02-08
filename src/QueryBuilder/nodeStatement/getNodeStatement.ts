import { Where } from '../../Where';
import { getIdentifierWithLabel } from '../identifierWithLabel';
import { getPropertiesWithParams } from '../propertiesWithParams';
import type { GetNodeStatementParams } from './getNodeStatement.types';

/**
 * Returns the appropriate string for a node, ready to be put in a statement
 * Example: (ident: Label { a.p1: $v1 })
 */
export const getNodeStatement = ({
  identifier,
  label,
  inner,
}: GetNodeStatementParams): string => {
  const nodeParts: string[] = [];

  if (identifier || label) {
    nodeParts.push(getIdentifierWithLabel(identifier, label));
  }

  if (inner) {
    if (typeof inner === 'string') {
      nodeParts.push(inner);
    } else if (inner instanceof Where) {
      nodeParts.push(inner.getStatement('object'));
    } else {
      nodeParts.push(
        getPropertiesWithParams(inner.properties, inner.bindParam),
      );
    }
  }

  return `(${nodeParts.join(' ')})`;
};
