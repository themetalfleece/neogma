// Legacy (experimental) decorator implementations.
// Import from 'neogma/legacy' when your project uses experimentalDecorators: true.

// Legacy decorators
export { Node } from './Node';
export { PrimaryKey } from './PrimaryKey';
export { Property } from './Property';
export { Relationship } from './Relationship';

// Shared — same base class, conversion, and inference for both decorator styles
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
} from '../inference';
export { NodeEntity } from '../NodeEntity';
export { clearModelRegistry, toModel } from '../toModel';
export type { NodeEntityClass, UntypedNeogmaModel } from '../types';

// Re-export TypeBox so consumers can use Type.String() etc. from a single import
export { default as Type } from 'typebox';
export type { TSchema } from 'typebox/type';
export { Value } from 'typebox/value';
