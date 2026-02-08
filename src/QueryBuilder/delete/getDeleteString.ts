import { NeogmaConstraintError } from '../../Errors';
import { escapeIfNeeded } from '../../utils/cypher';
import {
  assertDeleteValue,
  assertDeleteWithIdentifier,
  assertDeleteWithLiteral,
} from './assertDeleteValue';
import type { GetDeleteStringDelete } from './getDeleteString.types';
import {
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
} from './isDeleteParameter';

/**
 * Generates a DELETE clause string.
 *
 * **SECURITY WARNING**: String parameters and literal values are inserted directly
 * into the query without validation. Never pass user-provided input as strings.
 * Use the object format `{ identifiers, detach }` for safe queries.
 *
 * @example
 * // SAFE: Identifiers object format - identifiers are escaped if needed
 * getDeleteString({ identifiers: ['n', 'm'], detach: true });
 * // => "DETACH DELETE n, m"
 *
 * @example
 * // SAFE: Single identifier
 * getDeleteString({ identifiers: 'n' });
 * // => "DELETE n"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getDeleteString('n, m');
 * // => "DELETE n, m"
 *
 * @example
 * // UNSAFE: Literal format - no validation
 * getDeleteString({ literal: 'n, collect(m)', detach: true });
 * // => "DETACH DELETE n, collect(m)"
 */
export const getDeleteString = (dlt: GetDeleteStringDelete): string => {
  assertDeleteValue(dlt);

  // String input: escape hatch for complex expressions - no validation
  if (typeof dlt === 'string') {
    return `DELETE ${dlt}`;
  }

  // Validate before checking type - throws with specific error message if invalid
  assertDeleteWithIdentifier(dlt);
  assertDeleteWithLiteral(dlt);

  if (isDeleteWithIdentifier(dlt)) {
    const identifiers = Array.isArray(dlt.identifiers)
      ? dlt.identifiers
      : [dlt.identifiers];

    const safeIdentifiers = identifiers.map((id) => escapeIfNeeded(id));
    return `${dlt.detach ? 'DETACH ' : ''}DELETE ${safeIdentifiers.join(', ')}`;
  }

  // Literal: escape hatch - no validation
  if (isDeleteWithLiteral(dlt)) {
    return `${dlt.detach ? 'DETACH ' : ''}DELETE ${dlt.literal}`;
  }

  throw new NeogmaConstraintError('Invalid delete configuration');
};
