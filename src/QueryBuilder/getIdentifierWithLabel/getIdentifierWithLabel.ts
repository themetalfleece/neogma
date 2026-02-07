import { escapeIfNeeded, escapeLabelIfNeeded } from '../../utils/cypher';

/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null.
 * Identifiers and labels are escaped if they contain special characters.
 *
 * Labels can be passed as:
 * - Raw labels like `'Person'` or `'My Label'` (will be escaped if needed)
 * - Pre-escaped labels from `getLabel()` like `` `Person` `` (will not be double-escaped)
 *
 * @example
 * ```typescript
 * // Using model.getLabel() (already escaped) - no double-escaping
 * getIdentifierWithLabel('n', Model.getLabel()); // -> 'n:`ModelLabel`'
 *
 * // Raw label with spaces - auto-escaped
 * getIdentifierWithLabel('n', 'My Label'); // -> 'n:`My Label`'
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
  const safeLabel = label ? ':' + escapeLabelIfNeeded(label) : '';
  return `${safeIdentifier}${safeLabel}`;
};
