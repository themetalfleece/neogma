export { getMatchString } from './getMatchString';

// Types
export type {
  GetMatchStringDeps,
  GetMatchStringMatch,
  MatchI,
  MatchLiteralI,
  MatchMultipleI,
  MatchNodeI,
  MatchRelatedI,
} from './getMatchString.types';

// Type guards
export {
  isMatchLiteral,
  isMatchMultiple,
  isMatchParameter,
  isMatchRelated,
} from './isMatchParameter';

// Assertions
export {
  assertMatchLiteral,
  assertMatchMultiple,
  assertMatchRelated,
  assertMatchValue,
} from './assertMatchValue';
