export { getCreateOrMergeString } from './getCreateOrMergeString';

// Types
export type {
  CreateI,
  CreateMultipleI,
  CreateNodeI,
  CreateRelatedI,
  GetCreateOrMergeStringCreate,
  GetCreateOrMergeStringDeps,
  GetCreateOrMergeStringMode,
  MergeI,
} from './getCreateOrMergeString.types';

// Type guards
export {
  isCreateMultiple,
  isCreateParameter,
  isCreateRelated,
  isMergeParameter,
} from './isCreateOrMergeParameter';

// Assertion functions
export {
  assertCreateMultiple,
  assertCreateRelated,
  assertCreateValue,
  assertMergeValue,
} from './assertCreateOrMergeValue';
