import { NeogmaConstraintError } from '../../Errors';
import { escapeCypherIdentifier, escapeIfNeeded } from '../../utils/cypher';
import { isRemoveLabels, isRemoveProperties } from '../QueryBuilder.types';
import type { GetRemoveStringRemove } from './getRemoveString.types';

/**
 * Generates a REMOVE clause string.
 *
 * **SECURITY WARNING**: String parameters are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use the object
 * format for safe queries.
 *
 * @example
 * // SAFE: Properties object - property names are escaped if needed
 * getRemoveString({ identifier: 'n', properties: ['tempProp', 'oldData'] });
 * // => "REMOVE n.tempProp, n.oldData"
 *
 * @example
 * // SAFE: Labels object - labels are escaped with backticks
 * getRemoveString({ identifier: 'n', labels: ['TempLabel', 'My Label'] });
 * // => "REMOVE n:`TempLabel`:`My Label`"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getRemoveString('n.tempProp');
 * // => "REMOVE n.tempProp"
 */
export const getRemoveString = (remove: GetRemoveStringRemove): string => {
  // String input: escape hatch for complex expressions - no validation
  if (typeof remove === 'string') {
    return `REMOVE ${remove}`;
  }

  if (isRemoveProperties(remove)) {
    const properties = Array.isArray(remove.properties)
      ? remove.properties
      : [remove.properties];
    const safeIdentifier = escapeIfNeeded(remove.identifier);
    const propertiesWithIdentifier = properties.map(
      (p) => `${safeIdentifier}.${escapeIfNeeded(p)}`,
    );
    return `REMOVE ${propertiesWithIdentifier.join(', ')}`;
  }

  if (isRemoveLabels(remove)) {
    const labels = Array.isArray(remove.labels)
      ? remove.labels
      : [remove.labels];

    const safeIdentifier = escapeIfNeeded(remove.identifier);
    const escapedLabels = labels.map((l) => escapeCypherIdentifier(l));
    return `REMOVE ${safeIdentifier}:${escapedLabels.join(':')}`;
  }

  throw new NeogmaConstraintError('invalid remove configuration');
};
