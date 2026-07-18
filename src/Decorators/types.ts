import type { NeogmaModel } from '../ModelFactory';
import type { NodeEntity } from './NodeEntity';

/**
 * Constructor type for any class extending NodeEntity.
 *
 * `[Symbol.metadata]` is intentionally NOT part of this intersection: TS's
 * `lib.esnext.decorators` already augments the built-in `Function` interface
 * with `[Symbol.metadata]: DecoratorMetadata | null`, so every class
 * constructor is guaranteed to expose the property.
 *
 * Used as the key type in the model registry and as the parameter type for
 * `toModel()`.
 */
export type NodeEntityClass = abstract new (...args: unknown[]) => NodeEntity;

/**
 * A NeogmaModel with erased type parameters.
 * Used when the specific Properties/RelatedNodes/Methods/Statics
 * types are unknown, e.g. in the model registry and relationship configs.
 */
export type UntypedNeogmaModel = NeogmaModel<any, any, any, any>;

/**
 * Registry mapping decorated classes to their created NeogmaModels.
 * Used for resolving lazy relationship model references.
 */
export type ModelRegistry = Map<NodeEntityClass, UntypedNeogmaModel>;
