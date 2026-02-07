import { escapeIfNeeded } from '../../utils/cypher';

/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null.
 * Identifiers are escaped if they contain special characters.
 *
 * Note: Labels are expected to be already escaped (via getLabel()/getNormalizedLabels).
 * If passing a raw label, use escapeCypherIdentifier() first.
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
