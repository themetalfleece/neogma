import { escapeIfNeeded, escapeLabelIfNeeded } from '../../utils/cypher';

/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null.
 * Both identifiers and labels are escaped if they contain special characters.
 *
 * Both parameters support idempotent escaping - pre-escaped values will not be double-escaped:
 * - Raw values like `'my-prop'` or `'My Label'` will be escaped if needed
 * - Pre-escaped values like `` `my-prop` `` will be returned unchanged
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
 * // Pre-escaped identifier - no double-escaping
 * getIdentifierWithLabel('`my-node`', 'Person'); // -> '`my-node`:Person'
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
