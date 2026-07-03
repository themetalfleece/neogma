// Symbol.metadata polyfill — pinned as a top-level import so bundlers honouring
// `sideEffects` allowlists never tree-shake it away from the public entry. It is
// idempotent and must run before any decorator executes.
import './polyfill';

// Decorators
export { Node } from './decorators/Node';
export { Property } from './decorators/Property';
export { Relationship } from './decorators/Relationship';

// Base class
export { NodeEntity } from './NodeEntity';

// Conversion
export { clearModelRegistry, toModel } from './toModel';

// Inference helpers
export type {
  AsNeo4jProperties,
  InferMethods,
  InferProperties,
  InferRelatedNodes,
  InferStatics,
  Related,
} from './inference';

// Types
export type { NodeEntityClass, UntypedNeogmaModel } from './types';
