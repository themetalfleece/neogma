import './polyfill';

import type { TSchema } from 'typebox/type';

import type { NodeEntityClass } from './types';

/** Metadata key for @Node decorator options */
export const NEOGMA_NODE_KEY = Symbol('neogma:node');

/** Metadata key for @Property decorator entries */
export const NEOGMA_PROPERTIES_KEY = Symbol('neogma:properties');

/** Metadata key for @Relationship decorator entries */
export const NEOGMA_RELATIONSHIPS_KEY = Symbol('neogma:relationships');

// ── WeakMap-based metadata store ────────────────────────────────
// Both TC39 and legacy decorators write here. toModel() reads from here.
// Using a WeakMap avoids polluting classes and allows GC of unused classes.

interface ClassMetadataStore {
  [NEOGMA_NODE_KEY]?: NodeMetadata;
  [NEOGMA_PROPERTIES_KEY]?: PropertyMetadata[];
  [NEOGMA_RELATIONSHIPS_KEY]?: RelationshipMetadata[];
}

const classMetadataMap = new WeakMap<object, ClassMetadataStore>();

/**
 * Returns (or creates) the metadata store for a class constructor.
 * Used by both TC39 and legacy decorators.
 * @internal
 */
export function getClassMetadataStore(target: object): ClassMetadataStore {
  let store = classMetadataMap.get(target);
  if (!store) {
    store = {};
    classMetadataMap.set(target, store);
  }
  return store;
}

/**
 * Reads the metadata store for a class constructor.
 * Returns undefined if no decorators have been applied.
 * @internal
 */
export function readClassMetadataStore(
  target: object,
): ClassMetadataStore | undefined {
  return classMetadataMap.get(target);
}

/**
 * Shape stored under {@link NEOGMA_NODE_KEY}.
 * @internal — produced/consumed by `@Node` and `toModel()`; not a public API.
 */
export interface NodeMetadata {
  label: string | string[];
  primaryKeyField?: string;
}

/**
 * One entry per `@Property`-decorated field.
 * @internal — produced/consumed by `@Property` and `toModel()`; not a public API.
 */
export interface PropertyMetadata {
  propertyKey: string;
  schema?: TSchema;
}

/**
 * Per-property config stored on a `@Relationship` definition.
 * @internal — produced/consumed by `@Relationship` and `toModel()`; not a public API.
 */
export interface RelationshipPropertyEntry {
  /** The alias name used in create data (e.g., 'Rating') */
  alias: string;
  /** The actual Neo4j property name on the relationship (e.g., 'rating') */
  property: string;
  /** TypeBox schema for this relationship property */
  schema?: TSchema;
}

/**
 * One entry per `@Relationship`-decorated field.
 * @internal — produced/consumed by `@Relationship` and `toModel()`; not a public API.
 */
export interface RelationshipMetadata {
  /** The field name, used as the relationship alias (e.g., 'Orders') */
  alias: string;
  /** Direction of the relationship */
  direction: 'in' | 'out' | 'none';
  /** Neo4j relationship type name (e.g., 'CREATES') */
  name: string;
  /** Lazy reference to the target model class, or 'self' */
  model: (() => NodeEntityClass) | 'self';
  /** Relationship property configurations */
  properties?: RelationshipPropertyEntry[];
}

/**
 * Reads a typed metadata entry. Returns `undefined` when the key is absent.
 * Centralizes the single `as T | undefined` cast for all metadata reads.
 * @internal
 */
export function getMetadata<T>(
  metadata: DecoratorMetadataObject,
  key: symbol,
): T | undefined {
  return metadata[key] as T | undefined;
}

/**
 * Gets or initializes a metadata entry from the context metadata object.
 * @internal
 */
export function getOrCreateMetadata<T>(
  metadata: DecoratorMetadataObject,
  key: symbol,
  defaultValue: T,
): T {
  if (metadata[key] === undefined) {
    metadata[key] = defaultValue;
  }
  return metadata[key] as T;
}
