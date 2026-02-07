import { escapeIfNeeded } from '../../utils/cypher';

/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null.
 * Identifiers are escaped if they contain special characters.
 *
 * **IMPORTANT**: The `label` parameter is inserted as-is without escaping.
 * Callers MUST pass a Cypher-safe token, such as:
 * - The output of `getLabel()` (from a model, which uses `getNormalizedLabels`)
 * - The output of `escapeCypherIdentifier()` for raw labels
 *
 * Passing unescaped labels containing special characters (spaces, colons, backticks, etc.)
 * will produce invalid Cypher or potential injection vulnerabilities.
 *
 * @example
 * ```typescript
 * // Using model.getLabel() (already escaped)
 * getIdentifierWithLabel('n', Model.getLabel()); // -> 'n:`ModelLabel`'
 *
 * // Using escapeCypherIdentifier() for raw labels
 * getIdentifierWithLabel('n', escapeCypherIdentifier('My Label')); // -> 'n:`My Label`'
 *
 * // Valid identifier (no escaping needed)
 * getIdentifierWithLabel('n', 'Person'); // -> 'n:Person'
 * ```
 */
export const getIdentifierWithLabel = (
  identifier?: string,
  label?: string,
): string => {
  const safeIdentifier = identifier ? escapeIfNeeded(identifier) : '';
  // Labels are expected to already be escaped by getLabel()/getNormalizedLabels
  const safeLabel = label ? ':' + label : '';
  return `${safeIdentifier}${safeLabel}`;
};
