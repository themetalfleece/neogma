// Symbol.metadata polyfill — pinned as a top-level import so bundlers honouring
// `sideEffects` allowlists never tree-shake it away from the public entry. It is
// idempotent and must run before any decorator executes.
import './polyfill';

// Decorators
export { Node } from './decorators/Node';
export { PrimaryKey } from './decorators/PrimaryKey';
export { Property } from './decorators/Property';
export { Relationship } from './decorators/Relationship';

// Base class
export { NodeEntity } from './NodeEntity';

// Conversion (toModel is intentionally NOT exported here — use neogma.model() instead)
export { clearModelRegistry } from './toModel';

// Inference helpers
export type {
  AsNeo4jProperties,
  CreateRelProps,
  InferMethods,
  InferProperties,
  InferRelatedNodes,
  InferStatics,
  Related,
  RelPropsDef,
  RelPropsFrom,
} from './inference';

// Types
export type { NodeEntityClass, UntypedNeogmaModel } from './types';
