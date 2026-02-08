export { getDeleteString } from './getDeleteString';

// Types
export type {
  DeleteByIdentifierI,
  DeleteI,
  DeleteLiteralI,
  GetDeleteStringDelete,
} from './getDeleteString.types';

// Type guards
export {
  isDeleteParameter,
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
} from './isDeleteParameter';

// Assertions
export {
  assertDeleteValue,
  assertDeleteWithIdentifier,
  assertDeleteWithLiteral,
} from './assertDeleteValue';
