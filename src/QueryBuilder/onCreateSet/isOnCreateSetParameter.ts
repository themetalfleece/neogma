import type { OnCreateSetI } from './getOnCreateSetString.types';

/**
 * Type guard for OnCreateSetI. Checks if param has an 'onCreateSet' key.
 * Only checks for key presence; value validation happens in assertOnCreateSetValue.
 */
export const isOnCreateSetParameter = (
  param: unknown,
): param is OnCreateSetI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'onCreateSet')
  );
};
