/**
 * Surrounds the label with backticks to also allow spaces
 * @param label - the label to use
 * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
 */
export const getNormalizedLabels = (
  label: string | string[],
  operation?: 'and' | 'or',
): string => {
  const labels = label instanceof Array ? label : [label];
  return labels
    .map((l) => '`' + l + '`')
    .join(operation === 'or' ? '|' : ':');
};
