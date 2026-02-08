import type { UnwindI } from './getUnwindString.types';

/**
 * Type guard to check if a parameter has an 'unwind' key.
 * Only checks for key presence; value validation happens in assertUnwindValue.
 */
export const isUnwindParameter = (param: unknown): param is UnwindI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'unwind')
  );
};
