// Public exports
export { findMany } from './findMany.static';
export type { FindContext, FindManyParams } from './findMany.types';

// Eager loading types (re-exported from ModelFactory/index.ts)
export type {
  EagerLoadedRelationshipEntry,
  EagerLoadedRelationships,
  FindManyWithRelationshipsResult,
  InstanceWithRelationships,
  PlainWithRelationships,
  RelationshipLoadConfig,
  RelationshipsLoadConfig,
} from './eagerLoading.types';
