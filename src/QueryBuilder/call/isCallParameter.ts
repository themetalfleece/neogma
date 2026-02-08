import type { CallI } from './getCallString.types';

/**
 * Type guard to check if a parameter has a 'call' key.
 * Only checks for key presence; value validation happens in assertCallValue.
 */
export const isCallParameter = (param: unknown): param is CallI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'call')
  );
};
