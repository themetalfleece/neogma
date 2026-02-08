import type { WithI } from './getWithString.types';

/**
 * Type guard to check if a parameter has a 'with' key.
 * Only checks for key presence; value validation happens in assertWithValue.
 */
export const isWithParameter = (param: unknown): param is WithI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'with')
  );
};
