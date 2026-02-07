import { escapeIfNeeded, escapeLabelIfNeeded } from '../../utils/cypher';

/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null.
 * Both identifiers and labels are escaped if they contain special characters.
 *
 * Labels support idempotent escaping - pre-escaped labels from `getLabel()` will not be double-escaped.
 * Identifiers should always be passed as raw values (not pre-escaped).
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
 *
 * // Identifier with special characters - auto-escaped
 * getIdentifierWithLabel('my-node', 'Person'); // -> '`my-node`:Person'
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
