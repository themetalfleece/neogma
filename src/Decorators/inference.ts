import type { Literal as Neo4jLiteral } from '../Literal';
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '../ModelFactory';
import type { Neo4jSupportedTypes } from '../QueryRunner';
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
 * Branded handle for a related-node field on a decorated class.
 *
 * Use as the field's type so that `toModel(MyNode, neogma)` can infer the
 * full `RelatedNodesI` shape directly from the class — no separate
 * `*Related` interface required.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @PrimaryKey(Type.String())
 *   id!: string;
 *
 *   // With RelProps helpers (define once, derive both types):
 *   type OrderRelDef = { Rating: { property: 'rating'; type: number } };
 *
 *   @Relationship({
 *     name: 'CREATES',
 *     direction: 'out',
 *     model: () => OrderNode,
 *     properties: { Rating: { property: 'rating', schema: Type.Number() } },
 *   })
 *   Orders!: Related<typeof OrderNode, CreateRelProps<OrderRelDef>, RelPropsFrom<OrderRelDef>>;
 *
 *   // Or explicit two-type form:
 *   // Orders!: Related<typeof OrderNode, { Rating: number }, { rating: number }>;
 *
 *   // No relationship properties:
 *   @Relationship({ name: 'TAGGED_AS', direction: 'out', model: () => TagNode })
 *   Tags!: Related<typeof TagNode>;
 * }
 * ```
 */
export type Related<
  TClass extends abstract new (...args: never[]) => NodeEntity,
  CreateRelationshipProperties extends object = object,
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
  CreateRelationshipProperties,
  RelationshipProperties
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
