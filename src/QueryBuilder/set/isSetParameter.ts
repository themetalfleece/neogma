import { isPlainObject } from '../../utils/object';
import type { SetI, SetObjectI } from './getSetString.types';

/**
 * Type guard to check if a parameter has a 'set' key.
 * Only checks for key presence; value validation happens in assertSetValue.
 */
export const isSetParameter = (param: unknown): param is SetI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'set')
  );
};

/**
 * Type guard helper for SetObjectI. Returns true if the value is a valid SetObjectI.
 * Rejects arrays for properties - only plain objects are accepted.
 */
export const isSetObject = (set: SetI['set']): set is SetObjectI => {
  if (typeof set !== 'object' || set === null) {
    return false;
  }
  const setObj = set as SetObjectI;
  return (
    typeof setObj.identifier === 'string' &&
    setObj.identifier.trim().length > 0 &&
    isPlainObject(setObj.properties)
  );
};
