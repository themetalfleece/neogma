import type { Static, TSchema } from 'typebox/type';

import type { Literal as Neo4jLiteral } from '../Literal';
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '../ModelFactory';
import type { Neo4jSupportedTypes } from '../QueryRunner';
import type { RelationshipPropertyObject } from './metadata';
import type { NodeEntity } from './NodeEntity';

/**
 * Per-field coercion that satisfies the `Neo4jSupportedProperties`
 * constraint without merging an index signature into the resolved type
 * (which would clash with the relationship-creation params returned by
 * `CreateDataI`).
 *
 * @example
 * ```typescript
 * // Given a class-inferred property shape:
 * type Raw = { id: string; age: number; createdAt: Date };
 * // AsNeo4jProperties<Raw> keeps Neo4j-storable fields as-is; any field
 * // whose type is not a Neo4jSupportedType collapses to `never`, which
 * // surfaces at the toModel() call site as a type error.
 * type Storable = AsNeo4jProperties<Raw>;
 * //   ^? { id: string; age: number; createdAt: never }
 * ```
 */
export type AsNeo4jProperties<T> = {
  [K in keyof T]: T[K] extends Neo4jSupportedTypes | Neo4jLiteral | undefined
    ? T[K]
    : never;
};

/**
 * Mapping that describes relationship properties: alias → `{ property, type }`.
 *
 * Used with {@link CreateRelProps} and {@link RelPropsFrom} to declare
 * both the create-data (alias-keyed) and relationship (property-keyed)
 * types from a single definition.
 *
 * @example
 * ```typescript
 * // Define the property mapping once:
 * type OrderRelDef = {
 *   Rating: { property: 'rating'; type: number };
 *   Quantity: { property: 'quantity'; type: number };
 * };
 *
 * // Use with Related:
 * Orders!: Related<typeof OrderNode, CreateRelProps<OrderRelDef>, RelPropsFrom<OrderRelDef>>;
 *
 * // CreateRelProps<OrderRelDef> = { Rating: number; Quantity: number }
 * // RelPropsFrom<OrderRelDef>  = { rating: number; quantity: number }
 * ```
 */
export type RelPropsDef = Record<string, { property: string; type: unknown }>;

/**
 * Extracts the alias-keyed create-data shape from a {@link RelPropsDef}.
 *
 * `{ Rating: { property: 'rating'; type: number } }` → `{ Rating: number }`
 *
 * @example
 * ```typescript
 * type Def = { Rating: { property: 'rating'; type: number } };
 * type Create = CreateRelProps<Def>;
 * //   ^? { Rating: number }
 * ```
 */
export type CreateRelProps<T extends RelPropsDef> = {
  [K in keyof T]: T[K]['type'];
};

/**
 * Extracts the property-keyed relationship shape from a {@link RelPropsDef}.
 *
 * `{ Rating: { property: 'rating'; type: number } }` → `{ rating: number }`
 *
 * @example
 * ```typescript
 * type Def = { Rating: { property: 'rating'; type: number } };
 * type Rel = RelPropsFrom<Def>;
 * //   ^? { rating: number }
 * ```
 */
export type RelPropsFrom<T extends RelPropsDef> = {
  [K in keyof T as T[K]['property']]: T[K]['type'];
};

/**
 * Identity helper that captures literal types from a relationship-properties
 * config object without requiring `as const`. Uses TypeScript 5.0+ const type
 * parameters to infer literal string types for `property` fields automatically.
 *
 * @example
 * ```typescript
 * const orderRelProps = defineRelationshipProperties({
 *   Rating: { property: 'rating', schema: Type.Number() },
 * });
 *
 * // Use with @Relationship and Related<>:
 * @Relationship({ properties: orderRelProps })
 * Orders!: Related<typeof OrderNode, typeof orderRelProps>;
 * ```
 */
export function defineRelationshipProperties<
  const T extends RelationshipPropertyObject,
>(config: T): T {
  return config;
}

// ── Config-to-type inference helpers ─────────────────────────
// These let users define relationship properties ONCE in the
// @Relationship config and pass `typeof config` to Related<>,
// eliminating the need to manually spell out both create-data
// and relationship property types.

/**
 * Detects whether `T` has entries shaped like a `@Relationship`
 * properties config (values are `{ schema: TSchema }` or bare `TSchema`)
 * rather than plain scalar create-data props (values are `string`, `number`, etc.).
 */
type _HasConfigEntries<T extends object> = true extends {
  [K in keyof T]: T[K] extends TSchema
    ? true
    : T[K] extends { schema: TSchema }
      ? true
      : false;
}[keyof T]
  ? true
  : false;

/**
 * Derives alias-keyed create-data types from a `@Relationship` properties config.
 *
 * `{ Rating: { property: 'rating', schema: Type.Number() } }` → `{ Rating: number }`
 * `{ rating: Type.Number() }` → `{ rating: number }`   (shorthand)
 */
type _CreatePropsFromConfig<Config extends object> = {
  -readonly [K in keyof Config]: Config[K] extends TSchema
    ? Static<Config[K]>
    : Config[K] extends { schema: infer S extends TSchema }
      ? Static<S>
      : never;
};

/**
 * Derives property-keyed relationship types from a `@Relationship` properties config.
 * Uses the `property` field for key remapping; falls back to the alias key for shorthand entries.
 *
 * `{ Rating: { property: 'rating', schema: Type.Number() } }` → `{ rating: number }`
 * `{ rating: Type.Number() }` → `{ rating: number }`   (shorthand: alias === property)
 */
type _RelPropsFromConfig<Config extends object> = {
  -readonly [
    K in keyof Config as Config[K] extends {
      property: infer P extends string;
    }
      ? P
      : K & string
  ]: Config[K] extends TSchema
    ? Static<Config[K]>
    : Config[K] extends { schema: infer S extends TSchema }
      ? Static<S>
      : never;
};

/**
 * Branded handle for a related-node field on a decorated class.
 *
 * Use as the field's type so that `toModel(MyNode, neogma)` can infer the
 * full `RelatedNodesI` shape directly from the class — no separate
 * `*Related` interface required.
 *
 * There are three ways to specify relationship property types:
 *
 * **1. Config form (recommended)** — define properties once with
 * {@link defineRelationshipProperties}, share with `@Relationship`:
 * ```typescript
 * const orderRelProps = defineRelationshipProperties({
 *   Rating:   { property: 'rating',   schema: Type.Number() },
 *   Quantity: { property: 'quantity',  schema: Type.Number({ minimum: 1 }) },
 * });
 *
 * @Relationship({ name: 'PLACED', direction: 'out', model: () => OrderNode, properties: orderRelProps })
 * Orders!: Related<typeof OrderNode, typeof orderRelProps>;
 * // CreateRelProps = { Rating: number; Quantity: number }
 * // RelProps       = { rating: number; quantity: number }  (auto-derived)
 * ```
 *
 * **2. Explicit two-type form** — manually provide both types:
 * ```typescript
 * Orders!: Related<typeof OrderNode, { Rating: number }, { rating: number }>;
 * ```
 *
 * **3. No relationship properties:**
 * ```typescript
 * @Relationship({ name: 'TAGGED_AS', direction: 'out', model: () => TagNode })
 * Tags!: Related<typeof TagNode>;
 * ```
 */
export type Related<
  TClass extends abstract new (...args: never[]) => NodeEntity,
  CreateRelationshipPropertiesOrConfig extends object = object,
  RelationshipProperties extends object = object,
> = ModelRelatedNodesI<
  NeogmaModel<
    AsNeo4jProperties<InferProperties<InstanceType<TClass>>>,
    object,
    object,
    object
  >,
  NeogmaInstance<
    AsNeo4jProperties<InferProperties<InstanceType<TClass>>>,
    object
  >,
  _HasConfigEntries<CreateRelationshipPropertiesOrConfig> extends true
    ? _CreatePropsFromConfig<CreateRelationshipPropertiesOrConfig>
    : CreateRelationshipPropertiesOrConfig,
  _HasConfigEntries<CreateRelationshipPropertiesOrConfig> extends true
    ? _RelPropsFromConfig<CreateRelationshipPropertiesOrConfig>
    : RelationshipProperties
>;

/**
 * Picks the plain property fields off a decorated-class instance type:
 * any field whose runtime value is a function or a `Related<...>` handle
 * is filtered out, leaving only Neo4j-storable values.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @Property(Type.String()) id!: string;
 *   @Property(Type.String()) name!: string;
 *
 *   @Relationship({ name: 'CREATES', direction: 'out', model: () => OrderNode })
 *   Orders!: Related<typeof OrderNode>;
 *
 *   greet() { return `Hi, ${this.name}`; }
 * }
 *
 * type Props = InferProperties<UserNode>;
 * //   ^? { id: string; name: string }  — Orders and greet() are filtered out
 * ```
 */
export type InferProperties<T> = {
  [
    K in keyof T as T[K] extends (...args: never[]) => unknown
      ? never
      : [T[K]] extends [ModelRelatedNodesI<any, any, any, any>]
        ? never
        : K
  ]: T[K];
};

/**
 * Picks the relationship fields off a decorated-class instance type.
 * A field is considered a relationship when its declared type is `Related<...>`
 * (which expands to `ModelRelatedNodesI<…>`).
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @Property(Type.String()) id!: string;
 *
 *   @Relationship({ name: 'CREATES', direction: 'out', model: () => OrderNode })
 *   Orders!: Related<typeof OrderNode>;
 *
 *   @Relationship({ name: 'FOLLOWS', direction: 'out', model: 'self' })
 *   Follows!: Related<typeof UserNode>;
 * }
 *
 * type Rels = InferRelatedNodes<UserNode>;
 * //   ^? { Orders: Related<typeof OrderNode>; Follows: Related<typeof UserNode> }
 * ```
 */
export type InferRelatedNodes<T> = {
  [
    K in keyof T as [T[K]] extends [ModelRelatedNodesI<any, any, any, any>]
      ? K
      : never
  ]: T[K];
};

/**
 * Picks instance methods off a decorated-class instance type.
 * Used to populate the `MethodsI` generic of `NeogmaModel` automatically.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @Property(Type.String()) id!: string;
 *   @Property(Type.String()) name!: string;
 *
 *   greet(): string { return `Hi, ${this.name}`; }
 *   async touch(): Promise<void> { }
 * }
 *
 * type Methods = InferMethods<UserNode>;
 * //   ^? { greet: () => string; touch: () => Promise<void> }
 * ```
 */
export type InferMethods<T> = {
  [
    K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never
  ]: T[K];
};

/**
 * Picks static methods off the class itself, excluding the built-in
 * `prototype` / `length` / `name` keys carried by every JS class.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @Property(Type.String()) id!: string;
 *
 *   static async findActive(): Promise<UserNode[]> { return []; }
 *   static countAll(): number { return 0; }
 * }
 *
 * type Statics = InferStatics<typeof UserNode>;
 * //   ^? { findActive: () => Promise<UserNode[]>; countAll: () => number }
 * // `prototype`, `length`, `name` are excluded.
 * ```
 */
export type InferStatics<TClass> = {
  [
    K in keyof TClass as K extends 'prototype' | 'length' | 'name'
      ? never
      : TClass[K] extends (...args: never[]) => unknown
        ? K
        : never
  ]: TClass[K];
};
