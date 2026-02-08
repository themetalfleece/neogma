import type { WhereI } from './getWhereString.types';

/**
 * Type guard to check if a parameter has a 'where' key.
 * Only checks for key presence; value validation happens in assertWhereValue.
 */
export const isWhereParameter = (param: unknown): param is WhereI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'where')
  );
};
