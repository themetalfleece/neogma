import type { SkipI } from './getSkipString.types';

/**
 * Type guard to check if a parameter has a 'skip' key.
 * Only checks for key presence; value validation happens in assertSkipValue.
 */
export const isSkipParameter = (param: unknown): param is SkipI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'skip')
  );
};
