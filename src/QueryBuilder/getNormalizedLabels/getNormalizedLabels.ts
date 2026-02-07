/**
 * Surrounds the label with backticks to allow special characters (spaces, etc.).
 * Internal backticks are escaped by doubling them per Cypher syntax.
 * @param label - the label to use
 * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
 */
export const getNormalizedLabels = (
  label: string | string[],
  operation?: 'and' | 'or',
): string => {
  const labels = label instanceof Array ? label : [label];
  // Escape internal backticks by doubling them, then wrap in backticks
  // Convert to string defensively in case of runtime type violations
  return labels
    .map((l) => {
      const str = String(l ?? '');
      return '`' + str.replace(/`/g, '``') + '`';
    })
    .join(operation === 'or' ? '|' : ':');
};
