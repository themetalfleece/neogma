/**
 * Returns a string to be used in a query, regardless if any of the identifier or label are null
 */
export const getIdentifierWithLabel = (
  identifier?: string,
  label?: string,
): string => {
  return `${identifier ? identifier : ''}${label ? ':' + label : ''}`;
};
