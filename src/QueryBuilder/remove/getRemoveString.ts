import { NeogmaConstraintError } from '../../Errors';
import { escapeIfNeeded, escapeLabelIfNeeded } from '../../utils/cypher';
import {
  assertRemoveLabels,
  assertRemoveProperties,
  assertRemoveValue,
} from './assertRemoveValue';
import type { GetRemoveStringRemove } from './getRemoveString.types';
import { isRemoveLabels, isRemoveProperties } from './isRemoveParameter';

/**
 * Generates a REMOVE clause string.
 *
 * **SECURITY WARNING**: String parameters are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use the object
 * format for safe queries.
 *
 * Labels can be passed as raw strings or pre-escaped (from `getLabel()`).
 * Both formats are handled correctly without double-escaping.
 *
 * @example
 * // SAFE: Properties object - property names are escaped if needed
 * getRemoveString({ identifier: 'n', properties: ['tempProp', 'oldData'] });
 * // => "REMOVE n.tempProp, n.oldData"
 *
 * @example
 * // SAFE: Labels object - raw labels are escaped if needed
 * getRemoveString({ identifier: 'n', labels: ['TempLabel', 'My Label'] });
 * // => "REMOVE n:TempLabel:`My Label`"
 *
 * @example
 * // SAFE: Pre-escaped labels work correctly (no double-escaping)
 * getRemoveString({ identifier: 'n', labels: ['`My Label`'] });
 * // => "REMOVE n:`My Label`"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getRemoveString('n.tempProp');
 * // => "REMOVE n.tempProp"
 */
export const getRemoveString = (remove: GetRemoveStringRemove): string => {
  assertRemoveValue(remove);

  // String input: escape hatch for complex expressions - no validation
  if (typeof remove === 'string') {
    return `REMOVE ${remove}`;
  }

  // Validate before checking type - throws with specific error message if invalid
  assertRemoveProperties(remove);
  assertRemoveLabels(remove);

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
    const escapedLabels = labels.map((l) => escapeLabelIfNeeded(l));
    return `REMOVE ${safeIdentifier}:${escapedLabels.join(':')}`;
  }

  throw new NeogmaConstraintError('invalid remove configuration');
};
