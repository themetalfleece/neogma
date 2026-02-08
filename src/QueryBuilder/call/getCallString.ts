import { assertCallValue } from './assertCallValue';
import type { GetCallStringCall } from './getCallString.types';

/**
 * Generates a CALL subquery clause string.
 *
 * **SECURITY WARNING**: The string parameter is inserted directly into the query
 * without validation. Never pass user-provided input. Use parameterized values
 * via BindParam for dynamic data within the subquery.
 *
 * @example
 * // Basic subquery
 * getCallString('MATCH (n) RETURN n');
 * // => "CALL {\nMATCH (n) RETURN n\n}"
 *
 * @example
 * // Subquery with parameters (parameters should be bound externally)
 * getCallString('MATCH (n) WHERE n.id = $id RETURN n');
 * // => "CALL {\nMATCH (n) WHERE n.id = $id RETURN n\n}"
 */
export const getCallString = (call: GetCallStringCall): string => {
  assertCallValue(call);

  return `CALL {\n${call}\n}`;
};
