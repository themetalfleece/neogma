// Export ModelFactory
export { ModelFactory } from './ModelFactory';

// Export public types for backwards compatibility
export type {
  FindManyIncludeI,
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
  RelatedNodesCreationParamI,
  RelationshipPropertiesI,
  RelationshipsI,
} from './model.types';

// Export eager loading types
export type {
  EagerLoadedRelationshipEntry,
  EagerLoadedRelationships,
  FindManyWithRelationshipsResult,
  InstanceWithRelationships,
  PlainWithRelationships,
  RelationshipLoadConfig,
  RelationshipsLoadConfig,
} from './findMany/eagerLoading.types';
