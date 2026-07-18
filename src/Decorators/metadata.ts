import './polyfill';

import type { TSchema } from 'typebox/type';

import type { NodeEntityClass } from './types';

/** Metadata key for @Node decorator options */
export const NEOGMA_NODE_KEY = Symbol('neogma:node');

/** Metadata key for @Property decorator entries */
export const NEOGMA_PROPERTIES_KEY = Symbol('neogma:properties');

/** Metadata key for @Relationship decorator entries */
export const NEOGMA_RELATIONSHIPS_KEY = Symbol('neogma:relationships');

/** Metadata key for @PrimaryKey decorator */
export const NEOGMA_PRIMARY_KEY_FIELD = Symbol('neogma:primaryKeyField');

// ── WeakMap-based metadata store ────────────────────────────────
// Both TC39 and legacy decorators write here. toModel() reads from here.
// Using a WeakMap avoids polluting classes and allows GC of unused classes.

export interface ClassMetadataStore {
  [NEOGMA_NODE_KEY]?: NodeMetadata;
  [NEOGMA_PROPERTIES_KEY]?: PropertyMetadata[];
  [NEOGMA_RELATIONSHIPS_KEY]?: RelationshipMetadata[];
  [NEOGMA_PRIMARY_KEY_FIELD]?: string;
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
 * Per-property config stored on a `@Relationship` definition (internal form).
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
 * Object-syntax relationship property config.
 *
 * Keys are aliases; values are either:
 * - `{ property: string; schema?: TSchema }` when alias !== Neo4j property name
 * - a bare `TSchema` when alias === Neo4j property name (shorthand)
 *
 * @example
 * ```typescript
 * // Full form — alias "Rating" maps to Neo4j property "rating"
 * properties: { Rating: { property: 'rating', schema: Type.Number() } }
 *
 * // Shorthand — alias and property name are the same ("rating")
 * properties: { rating: Type.Number() }
 * ```
 */
export type RelationshipPropertyObject = Record<
  string,
  TSchema | { property: string; schema?: TSchema }
>;

/**
 * Accepted input forms for relationship properties in decorator options.
 *
 * The **object form** ({@link RelationshipPropertyObject}) is the recommended syntax.
 *
 * The **array form** ({@link RelationshipPropertyEntry}[]) is deprecated and
 * will be removed in a future release. Migrate to the object form.
 *
 * @deprecated The array form is deprecated. Use the object form instead.
 */
export type RelationshipPropertyInput =
  RelationshipPropertyEntry[] | RelationshipPropertyObject;

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
  /** Relationship property configurations (already normalized) */
  properties?: RelationshipPropertyEntry[];
  /**
   * Deferred properties resolver. When `@Relationship` receives a function
   * for `properties`, the function is stored here and resolved lazily in
   * `toModel()` (after static field initializers have run).
   * @internal
   */
  deferredProperties?: () => RelationshipPropertyInput;
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

/**
 * Normalizes relationship property input (array or object form) into the
 * internal array-of-entries form.
 *
 * - Array input: returned as-is (legacy syntax).
 * - Object input: keys are aliases. Each value is either a bare `TSchema`
 *   (shorthand: alias === property name) or `{ property, schema? }`.
 *
 * @internal
 */
export function normalizeRelationshipProperties(
  input: RelationshipPropertyInput | undefined,
): RelationshipPropertyEntry[] | undefined {
  if (!input) return undefined;

  // Array form — deprecated legacy syntax, pass through.
  if (Array.isArray(input)) {
    warnArrayRelationshipProperties();
    return input;
  }

  // Object form — convert to array.
  const entries: RelationshipPropertyEntry[] = [];
  for (const [alias, value] of Object.entries(input)) {
    if (isRelPropertyTSchema(value)) {
      // Shorthand: alias === property name, value is the schema
      entries.push({ alias, property: alias, schema: value });
    } else {
      // Full form: { property, schema? }
      const obj = value as { property: string; schema?: TSchema };
      entries.push({ alias, property: obj.property, schema: obj.schema });
    }
  }
  return entries.length > 0 ? entries : undefined;
}

/** One-time warning for deprecated array relationship properties syntax. */
let _warnedArrayRelProps = false;
function warnArrayRelationshipProperties(): void {
  if (_warnedArrayRelProps) return;
  _warnedArrayRelProps = true;
  console.warn(
    '[neogma] The array syntax for relationship properties ([ { alias, property, schema } ]) ' +
      'is deprecated and will be removed in a future release. ' +
      'Use the object syntax instead: { Alias: { property, schema } }. ' +
      'See the migration guide: https://neogma.themetalfleece.dev/docs/migration',
  );
}

/**
 * Detects whether a value is a TSchema (TypeBox schema).
 * TypeBox v1 attaches a non-enumerable `~kind` string to every schema.
 * We also check for `type` as a string to cover cloned schemas where
 * `~kind` may have been stripped.
 * @internal
 */
function isRelPropertyTSchema(value: unknown): value is TSchema {
  if (value === null || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  // TypeBox v1 canonical detection
  if (typeof rec['~kind'] === 'string') return true;
  // Fallback: has `type` (string) but NOT `property` (which would be our
  // full-form object syntax)
  if (typeof rec['type'] === 'string' && !('property' in rec)) return true;
  return false;
}
