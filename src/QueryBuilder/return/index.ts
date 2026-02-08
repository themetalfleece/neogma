export { getReturnString } from './getReturnString';

// Types
export type {
  GetReturnStringReturn,
  ReturnElementI,
  ReturnI,
  ReturnObjectI,
} from './getReturnString.types';

// Type guards
export {
  isReturnObject,
  isReturnParameter,
  isValidReturnElement,
} from './isReturnParameter';

// Assertions
export { assertReturnObject, assertReturnValue } from './assertReturnValue';
