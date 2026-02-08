// Re-export shared types for backward compatibility
export * from './shared';

// Re-export from clause directories for backward compatibility
export type { CallI } from './call';
export { assertCallValue, isCallParameter } from './call';
export type {
  CreateI,
  CreateMultipleI,
  CreateNodeI,
  CreateRelatedI,
  MergeI,
} from './createOrMerge';
export {
  assertCreateMultiple,
  assertCreateRelated,
  assertCreateValue,
  assertMergeValue,
  isCreateMultiple,
  isCreateParameter,
  isCreateRelated,
  isMergeParameter,
} from './createOrMerge';
export type { DeleteByIdentifierI, DeleteI, DeleteLiteralI } from './delete';
export {
  assertDeleteValue,
  assertDeleteWithIdentifier,
  assertDeleteWithLiteral,
  isDeleteParameter,
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
} from './delete';
export type { ForEachI } from './forEach';
export { assertForEachValue, isForEachParameter } from './forEach';
export type { LimitI } from './limit';
export { assertLimitValue, isLimitParameter } from './limit';
export type {
  MatchI,
  MatchLiteralI,
  MatchMultipleI,
  MatchNodeI,
  MatchRelatedI,
} from './match';
export {
  assertMatchLiteral,
  assertMatchMultiple,
  assertMatchRelated,
  assertMatchValue,
  isMatchLiteral,
  isMatchMultiple,
  isMatchParameter,
  isMatchRelated,
} from './match';
export type { OnCreateSetI, OnCreateSetObjectI } from './onCreateSet';
export {
  assertOnCreateSetValue,
  isOnCreateSetObject,
  isOnCreateSetParameter,
} from './onCreateSet';
export type { OnMatchSetI, OnMatchSetObjectI } from './onMatchSet';
export {
  assertOnMatchSetValue,
  isOnMatchSetObject,
  isOnMatchSetParameter,
} from './onMatchSet';
export type { OrderByI, OrderByObjectI } from './orderBy';
export {
  assertOrderByValue,
  isOrderByObject,
  isOrderByParameter,
} from './orderBy';
export type { RawI } from './raw';
export { assertRawValue, isRawParameter } from './raw';
export type { RemoveI, RemoveLabelsI, RemovePropertiesI } from './remove';
export {
  assertRemoveLabels,
  assertRemoveProperties,
  assertRemoveValue,
  isRemoveLabels,
  isRemoveParameter,
  isRemoveProperties,
} from './remove';
export type { ReturnElementI, ReturnI, ReturnObjectI } from './return';
export {
  assertReturnObject,
  assertReturnValue,
  isReturnObject,
  isReturnParameter,
  isValidReturnElement,
} from './return';
export type { SetI, SetObjectI } from './set';
export { assertSetValue, isSetObject, isSetParameter } from './set';
export type { SkipI } from './skip';
export { assertSkipValue, isSkipParameter } from './skip';
export type { UnwindI, UnwindObjectI } from './unwind';
export { assertUnwindValue, isUnwindObject, isUnwindParameter } from './unwind';
export type { WhereI } from './where';
export { assertWhereValue, isWhereParameter } from './where';
export type { WithI } from './with';
export { assertWithValue, isWithParameter } from './with';

// Import shared types for local use in this file
import type { CallI } from './call';
import type { CreateI, MergeI } from './createOrMerge';
import type { DeleteI } from './delete';
import type { ForEachI } from './forEach';
import type { LimitI } from './limit';
import type { MatchI } from './match';
import type { OnCreateSetI } from './onCreateSet';
import type { OnMatchSetI } from './onMatchSet';
import type { OrderByI } from './orderBy';
// Import clause types for ParameterI union
import type { RawI } from './raw';
import type { RemoveI } from './remove';
import type { ReturnI } from './return';
import type { SetI } from './set';
import type { SkipI } from './skip';
import type { UnwindI } from './unwind';
import type { WhereI } from './where';
import type { WithI } from './with';

export type ParameterI =
  | RawI
  | MatchI
  | CreateI
  | MergeI
  | SetI
  | DeleteI
  | RemoveI
  | ReturnI
  | OrderByI
  | UnwindI
  | ForEachI
  | LimitI
  | SkipI
  | WithI
  | WhereI
  | OnCreateSetI
  | OnMatchSetI
  | CallI
  | null
  | undefined;
