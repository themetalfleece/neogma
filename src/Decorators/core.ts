/**
 * Shared core logic for decorator implementations (TC39 and legacy).
 *
 * Each decorator pair (TC39 in `decorators/` and legacy in `legacy/`) was
 * previously a standalone copy of the same validation + registration logic,
 * differing only in how metadata is accessed. This module extracts the
 * common parts so both flavors are thin wrappers around the same code.
 *
 * @internal — not part of the public API.
 */

import type { TSchema } from 'typebox/type';

import { NeogmaModelSchemaError } from '../Errors';
import {
  type ClassMetadataStore,
  NEOGMA_PRIMARY_KEY_FIELD,
  NEOGMA_PROPERTIES_KEY,
  NEOGMA_RELATIONSHIPS_KEY,
  normalizeRelationshipProperties,
  type PropertyMetadata,
  type RelationshipMetadata,
  type RelationshipPropertyInput,
} from './metadata';
import type { NodeEntityClass } from './types';

// ── Metadata accessor abstraction ──────────────────────────────
// Both TC39 and legacy decorators provide a "store" that reads/writes
// metadata keyed by symbols. This interface lets the core functions
// operate on either without caring which decorator system is in use.

export interface MetadataStore {
  get<T>(key: symbol): T | undefined;
  set(key: symbol, value: unknown): void;
  getOrCreate<T>(key: symbol, defaultValue: T): T;
}

/**
 * Creates a MetadataStore backed by TC39's `context.metadata` object.
 * @internal
 */
export function tc39Store(metadata: DecoratorMetadataObject): MetadataStore {
  return {
    get: <T>(key: symbol) => metadata[key] as T | undefined,
    set: (key: symbol, value: unknown) => {
      metadata[key] = value;
    },
    getOrCreate: <T>(key: symbol, defaultValue: T) => {
      if (metadata[key] === undefined) {
        metadata[key] = defaultValue;
      }
      return metadata[key] as T;
    },
  };
}

/**
 * Creates a MetadataStore backed by the WeakMap-based ClassMetadataStore.
 * @internal
 */
export function weakMapStore(store: ClassMetadataStore): MetadataStore {
  // Cast once: ClassMetadataStore uses unique symbol keys but the
  // MetadataStore abstraction uses generic symbol keys.
  const rec = store as Record<symbol, unknown>;
  return {
    get: <T>(key: symbol) => rec[key] as T | undefined,
    set: (key: symbol, value: unknown) => {
      rec[key] = value;
    },
    getOrCreate: <T>(key: symbol, defaultValue: T) => {
      if (rec[key] === undefined) {
        rec[key] = defaultValue;
      }
      return rec[key] as T;
    },
  };
}

// ── Shared registration functions ──────────────────────────────

/**
 * Core logic for `@Property`. Validates uniqueness and pushes the entry.
 * @internal
 */
export function registerProperty(
  store: MetadataStore,
  propertyKey: string,
  schema?: TSchema,
): void {
  const properties = store.getOrCreate<PropertyMetadata[]>(
    NEOGMA_PROPERTIES_KEY,
    [],
  );
  if (properties.some((p) => p.propertyKey === propertyKey)) {
    throw new NeogmaModelSchemaError(
      `@Property decorator applied more than once to field "${propertyKey}". ` +
        `Each field may only carry a single @Property decoration.`,
      { propertyKey },
    );
  }
  properties.push({ propertyKey, schema });
}

/**
 * Core logic for `@PrimaryKey`. Enforces single-key constraint and
 * auto-registers as `@Property`.
 * @internal
 */
export function registerPrimaryKey(
  store: MetadataStore,
  propertyKey: string,
  schema?: TSchema,
): void {
  const existing = store.get<string>(NEOGMA_PRIMARY_KEY_FIELD);
  if (existing !== undefined) {
    throw new NeogmaModelSchemaError(
      `@PrimaryKey applied to field "${propertyKey}" but field "${existing}" ` +
        `is already marked as primary key. Only one field per class may be ` +
        `decorated with @PrimaryKey.`,
      { propertyKey },
    );
  }
  store.set(NEOGMA_PRIMARY_KEY_FIELD, propertyKey);

  // Auto-register as @Property (unless already decorated)
  const properties = store.getOrCreate<PropertyMetadata[]>(
    NEOGMA_PROPERTIES_KEY,
    [],
  );
  if (!properties.some((p) => p.propertyKey === propertyKey)) {
    properties.push({ propertyKey, schema });
  }
}

/**
 * Options accepted by `@Relationship` (shared between TC39 and legacy).
 */
export interface RelationshipOptions {
  /** The Neo4j relationship type name (e.g., 'CREATES') */
  name: string;
  /** Direction of the relationship */
  direction: 'in' | 'out' | 'none';
  /**
   * Lazy reference to the target model class, or 'self' for self-referencing.
   * Use a function to avoid circular reference issues: `() => OrderNode`
   */
  model: (() => NodeEntityClass) | 'self';
  /**
   * Relationship property configurations. Accepts object, array, or function syntax.
   * The function form defers evaluation for use with static class members.
   */
  properties?: RelationshipPropertyInput | (() => RelationshipPropertyInput);
}

/**
 * Core logic for `@Relationship`. Validates uniqueness, normalizes
 * properties (or stores deferred resolver), and pushes the entry.
 * @internal
 */
export function registerRelationship(
  store: MetadataStore,
  alias: string,
  options: RelationshipOptions,
): void {
  const relationships = store.getOrCreate<RelationshipMetadata[]>(
    NEOGMA_RELATIONSHIPS_KEY,
    [],
  );
  if (relationships.some((r) => r.alias === alias)) {
    throw new NeogmaModelSchemaError(
      `@Relationship decorator applied more than once to field "${alias}". ` +
        `Each field may only carry a single @Relationship decoration.`,
      { propertyKey: alias },
    );
  }
  if (typeof options.properties === 'function') {
    // Deferred: store the resolver for toModel() to call later, after
    // static field initializers have run.
    relationships.push({
      alias,
      direction: options.direction,
      name: options.name,
      model: options.model,
      deferredProperties: options.properties,
    });
  } else {
    relationships.push({
      alias,
      direction: options.direction,
      name: options.name,
      model: options.model,
      properties: normalizeRelationshipProperties(options.properties),
    });
  }
}
