import type { OnMatchSetI } from './getOnMatchSetString.types';

/**
 * Type guard for OnMatchSetI. Checks if param has an 'onMatchSet' key.
 * Only checks for key presence; value validation happens in assertOnMatchSetValue.
 */
export const isOnMatchSetParameter = (param: unknown): param is OnMatchSetI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'onMatchSet')
  );
};
