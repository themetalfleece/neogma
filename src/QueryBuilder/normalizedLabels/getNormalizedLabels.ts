import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';

/**
 * Surrounds the label with backticks to allow special characters (spaces, etc.).
 * Internal backticks are escaped by doubling them per Cypher syntax.
 *
 * @param label - the label to use (must be non-empty string or array of non-empty strings)
 * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
 * @throws NeogmaConstraintError if any label is null, undefined, empty, or whitespace-only
 */
export const getNormalizedLabels = (
  label: string | string[],
  operation?: 'and' | 'or',
): string => {
  const labels = label instanceof Array ? label : [label];

  // Validate and escape each label
  return labels
    .map((l, index) => {
      // Validate label is a non-empty string
      if (l === null || l === undefined) {
        throw new NeogmaConstraintError(
          `Invalid label at index ${index}: expected a non-empty string, got ${l === null ? 'null' : 'undefined'}`,
        );
      }
      if (typeof l !== 'string') {
        throw new NeogmaConstraintError(
          `Invalid label at index ${index}: expected a string, got ${typeof l}`,
        );
      }
      if (l.trim().length === 0) {
        throw new NeogmaConstraintError(
          `Invalid label at index ${index}: label cannot be empty or whitespace-only`,
        );
      }
      // Escape internal backticks by doubling them, then wrap in backticks
      return '`' + l.replace(/`/g, '``') + '`';
    })
    .join(operation === 'or' ? '|' : ':');
};
