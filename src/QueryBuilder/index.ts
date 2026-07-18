// Public API: QueryBuilder class and its parameter types
export * from './QueryBuilder';
export type { ParameterI } from './QueryBuilder.types';

// Public API: Clause interfaces (used to construct QueryBuilder parameters)
export type { CallI } from './call';
export type {
  CreateI,
  CreateMultipleI,
  CreateNodeI,
  CreateRelatedI,
  MergeI,
} from './createOrMerge';
export type { DeleteByIdentifierI, DeleteI, DeleteLiteralI } from './delete';
export type { ForEachI } from './forEach';
export type { LimitI } from './limit';
export type {
  MatchI,
  MatchLiteralI,
  MatchMultipleI,
  MatchNodeI,
  MatchRelatedI,
} from './match';
export type { OnCreateSetI, OnCreateSetObjectI } from './onCreateSet';
export type { OnMatchSetI, OnMatchSetObjectI } from './onMatchSet';
export type { OrderByI, OrderByObjectI } from './orderBy';
export type { RawI } from './raw';
export type { RemoveI, RemoveLabelsI, RemovePropertiesI } from './remove';
export type { ReturnElementI, ReturnI, ReturnObjectI } from './return';
export type { SetI, SetObjectI } from './set';
export type { SkipI } from './skip';
export type { UnwindI, UnwindObjectI } from './unwind';
export type { WhereI } from './where';
export type { WithI } from './with';

// Public API: Shared domain types (used by clause interfaces)
export type {
  NodeForCreateI,
  NodeForCreateObjectI,
  NodeForCreateWithLabelI,
  NodeForCreateWithModelI,
  NodeForMatchI,
  NodeForMatchObjectI,
} from './shared';
export type {
  RelationshipForCreateI,
  RelationshipForCreateObjectI,
  RelationshipForMatchI,
  RelationshipForMatchObjectI,
} from './shared';

// Public API: Static utility functions exposed on QueryBuilder
export { getIdentifierWithLabel } from './identifierWithLabel';
export type { GetNodeStatementParams } from './nodeStatement';
export { getNodeStatement } from './nodeStatement';
export { getNormalizedLabels } from './normalizedLabels';
export { getPropertiesWithParams } from './propertiesWithParams';
export type { GetRelationshipStatementParams } from './relationshipStatement';
export { getRelationshipStatement } from './relationshipStatement';
export type { GetSetPartsParams, GetSetPartsResult } from './setParts';
export { getSetParts } from './setParts';
export { getVariableLengthRelationshipString } from './variableLengthRelationship';
