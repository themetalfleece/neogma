import type { Literal } from '../Literal';
import type {
  Neo4jSingleTypes,
  Neo4jSupportedTypes,
} from '../QueryRunner/QueryRunner.types';

// ============ Where Operator Symbols ============

/** symbols for Where operations */
const OpEq: unique symbol = Symbol('eq');
const OpIn: unique symbol = Symbol('in');
const Op_In: unique symbol = Symbol('_in');
const OpContains: unique symbol = Symbol('contains');
const OpGt: unique symbol = Symbol('gt');
const OpGte: unique symbol = Symbol('gte');
const OpLt: unique symbol = Symbol('lt');
const OpLte: unique symbol = Symbol('lte');
const OpNe: unique symbol = Symbol('ne');
const OpIsNull: unique symbol = Symbol('isNull');
const OpIsNotNull: unique symbol = Symbol('isNotNull');

export const Op = {
  eq: OpEq,
  in: OpIn,
  _in: Op_In,
  contains: OpContains,
  gt: OpGt,
  gte: OpGte,
  lt: OpLt,
  lte: OpLte,
  ne: OpNe,
  isNull: OpIsNull,
  isNotNull: OpIsNotNull,
} as const;

// ============ Where Type Definitions ============

export type WhereTypes = {
  Eq: {
    [Op.eq]: Neo4jSupportedTypes | Literal;
  };
  Ne: {
    [Op.ne]: Neo4jSupportedTypes | Literal;
  };
  In: {
    /**
     * Neo4jSingleTypes[][] is needed to support Op.in on array-typed properties.
     * E.g., for a `string[]` property, Op.in takes `string[][]` (array of possible array values).
     * Note: This extends beyond Neo4jSupportedTypes which only goes to Neo4jSingleTypes[].
     * The Neo4j driver handles nested arrays correctly at runtime.
     */
    [Op.in]: Neo4jSingleTypes[] | Neo4jSingleTypes[][] | Literal;
  };
  _In: {
    [Op._in]: Neo4jSingleTypes | Literal;
  };
  Contains: {
    [Op.contains]: Neo4jSingleTypes | Literal;
  };
  Gt: {
    [Op.gt]: Neo4jSingleTypes | Literal;
  };
  Gte: {
    [Op.gte]: Neo4jSingleTypes | Literal;
  };
  Lt: {
    [Op.lt]: Neo4jSingleTypes | Literal;
  };
  Lte: {
    [Op.lte]: Neo4jSingleTypes | Literal;
  };
  /**
   * Check if a property is null.
   * Generates: `property IS NULL`
   */
  IsNull: {
    [Op.isNull]: true;
  };
  /**
   * Check if a property is not null.
   * Generates: `property IS NOT NULL`
   */
  IsNotNull: {
    [Op.isNotNull]: true;
  };
};

// ============ Where Value Types ============

/**
 * Permissive where value type that accepts any Neo4j supported type.
 * Used as fallback when no type parameter is provided or type is unknown.
 */
type PermissiveWhereValue =
  | Neo4jSupportedTypes
  | WhereTypes['Eq']
  | WhereTypes['In']
  | WhereTypes['_In']
  | WhereTypes['Contains']
  | WhereTypes['Gt']
  | WhereTypes['Gte']
  | WhereTypes['Lt']
  | WhereTypes['Lte']
  | WhereTypes['Ne']
  | WhereTypes['IsNull']
  | WhereTypes['IsNotNull']
  | null // Direct null means IS NULL
  | Literal;

/**
 * Base operators available for all scalar Neo4j types.
 *
 * **Note on arrays:** A direct array value `T[]` is treated as equality at runtime
 * (`property = [values]`), NOT as IN. For IN queries, use `{ [Op.in]: values }`
 * or wrap with `Where.ensureIn(values)`.
 *
 * @internal
 */
type BaseScalarOperators<T extends Neo4jSingleTypes> =
  | T // Direct value: property = value
  | T[] // Array value: property = [values] (equality, use Op.in for IN queries)
  | { [Op.eq]: T | Literal } // Equality: property = value
  | { [Op.ne]: T | Literal } // Not equal: property <> value
  | { [Op.in]: T[] | Literal } // In list: property IN [values]
  | { [Op._in]: T | Literal } // Value in property: value IN property
  | { [Op.gt]: T | Literal } // Greater than: property > value
  | { [Op.gte]: T | Literal } // Greater or equal: property >= value
  | { [Op.lt]: T | Literal } // Less than: property < value
  | { [Op.lte]: T | Literal } // Less or equal: property <= value
  | { [Op.isNull]: true } // Null check: property IS NULL
  | { [Op.isNotNull]: true } // Not null check: property IS NOT NULL
  | null // Direct null: property IS NULL (shorthand for Op.isNull)
  | Literal; // Raw Cypher literal

/**
 * Operators available only for string types.
 * Extends base operators with string-specific operations like CONTAINS.
 * @internal
 */
type StringScalarOperators =
  | BaseScalarOperators<string>
  | { [Op.contains]: string | Literal }; // Contains: property CONTAINS value

/**
 * Type-safe where value for scalar (non-array) Neo4j types.
 * Supports comparison operators with type-appropriate constraints:
 * - All types: eq, ne, in, _in, gt, gte, lt, lte
 * - String only: contains (for substring matching)
 *
 * @typeParam T - A scalar Neo4j type (string, number, boolean, etc.)
 */
type ScalarWhereValue<T extends Neo4jSingleTypes> = T extends string
  ? StringScalarOperators
  : BaseScalarOperators<T>;

/**
 * Type-safe where value for array-typed Neo4j properties.
 * Supports a subset of operators that make sense for arrays in Cypher.
 *
 * Note: Op.contains is NOT included because Cypher's CONTAINS is for
 * substring matching in strings, not for checking array membership.
 * Use Op._in instead (generates `element IN arrayProperty`).
 *
 * @typeParam T - The full array type (e.g., string[])
 * @typeParam E - The element type of the array (e.g., string)
 */
type ArrayWhereValue<
  T extends Neo4jSingleTypes[],
  E extends Neo4jSingleTypes,
> =
  | T // Direct value: property = [values]
  | { [Op.eq]: T | Literal } // Exact match: property = [values]
  | { [Op.ne]: T | Literal } // Not equal: property <> [values]
  | { [Op._in]: E | Literal } // Element in array: element IN property
  | { [Op.in]: T[] | Literal } // Array in list: property IN [[a,b], [c,d]]
  | { [Op.isNull]: true } // Null check: property IS NULL
  | { [Op.isNotNull]: true } // Not null check: property IS NOT NULL
  | null // Direct null: property IS NULL (shorthand for Op.isNull)
  | Literal; // Raw Cypher literal

/**
 * Type-safe where value that constrains the value to match the property type.
 *
 * **Behavior by type:**
 * - `unknown` (default): Permissive - accepts any Neo4j type and all operators
 * - Scalar types (`string`, `number`, `boolean`): Strict - validates value types for all operators
 * - Array types (`string[]`, `number[]`): Strict - validates element types, limited operators
 *
 * **Array operator notes:**
 * - Use `Op._in` to check if an element exists in an array property (`'a' IN tags`)
 * - `Op.contains` is NOT available for arrays (it's for string substring matching)
 * - `Op.eq`/`Op.ne` compare entire arrays
 * - `Op.in` checks if the array equals one of several arrays
 *
 * @typeParam T - The property type to validate against. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // Permissive (no type parameter)
 * const any: WhereValuesI = 'string';
 * const any2: WhereValuesI = { [Op.gt]: 5 };
 *
 * // Scalar types - all operators available
 * const str: WhereValuesI<string> = 'John';
 * const strOp: WhereValuesI<string> = { [Op.contains]: 'Jo' };
 * const num: WhereValuesI<number> = { [Op.gte]: 18 };
 *
 * // Array types - limited operators
 * const arr: WhereValuesI<string[]> = ['a', 'b'];
 * const arrIn: WhereValuesI<string[]> = { [Op._in]: 'a' }; // 'a' IN property
 * const arrEq: WhereValuesI<string[]> = { [Op.eq]: ['a', 'b'] }; // exact match
 * ```
 */
export type WhereValuesI<T = unknown> =
  NonNullable<T> extends Neo4jSingleTypes
    ? ScalarWhereValue<NonNullable<T>>
    : NonNullable<T> extends Array<infer E extends Neo4jSingleTypes>
      ? ArrayWhereValue<NonNullable<T>, E>
      : PermissiveWhereValue;

// ============ Where Params Types ============

/**
 * Type-safe where parameters that constrain keys to model properties and values to match property types.
 * When Properties is not provided or is a generic Record type, falls back to permissive behavior.
 * When Properties has specific keys, validates both property names and value types.
 *
 * **Note:** Properties with `undefined` values are silently dropped at runtime by `Where.addParams`.
 * To omit a filter, either don't include the key or explicitly handle the undefined case before passing.
 *
 * @typeParam Properties - The type of the model properties to filter by.
 *                         Defaults to Record<string, unknown> for permissive behavior.
 *
 * @example
 * ```typescript
 * // Without type parameter - permissive, accepts any key/value
 * const permissive: WhereParamsI = { anyKey: 'anyValue', num: 123 };
 *
 * // With type parameter - strict type checking
 * type UserProps = { id: string; name: string; age: number };
 *
 * // Valid: correct property names and matching value types
 * const where: WhereParamsI<UserProps> = { name: 'John', age: 25 };
 *
 * // Invalid: 'nam' is not a valid property - TypeScript error
 * const invalid1: WhereParamsI<UserProps> = { nam: 'John' }; // Error!
 *
 * // Invalid: age expects number, not string - TypeScript error
 * const invalid2: WhereParamsI<UserProps> = { age: 'twenty-five' }; // Error!
 * ```
 */
export type WhereParamsI<Properties = Record<string, unknown>> =
  // Check if Properties has an index signature (permissive) vs specific keys (strict)
  string extends keyof Properties
    ? // Permissive: allow any string key with any where value
      { [key: string]: WhereValuesI | undefined }
    : // Strict: map specific keys to typed values
      { [K in keyof Properties]?: WhereValuesI<Properties[K]> };

/**
 * an object with the query identifiers as keys and the attributes+types as value
 */
export interface WhereParamsByIdentifierI {
  /** the identifiers to use */
  [identifier: string]: WhereParamsI;
}

/**
 * Helper type to extract properties from a NeogmaInstance or plain object.
 * Instances have both properties and methods, so we extract only the data properties.
 */
export type ExtractPropertiesFromInstance<T> = T extends {
  dataValues: infer P;
}
  ? P
  : T;

/**
 * Type-safe where parameters for relationship queries.
 * Provides compile-time validation for source, target, and relationship property names.
 *
 * @typeParam SourceProperties - Properties of the source node
 * @typeParam TargetProperties - Properties of the target node
 * @typeParam RelationshipProperties - Properties of the relationship
 *
 * @example
 * ```typescript
 * type User = { id: string; name: string };
 * type Order = { id: string; orderNumber: string };
 * type OrderRel = { rating: number };
 *
 * const where: TypedRelationshipWhereI<User, Order, OrderRel> = {
 *   source: { name: 'John' },           // Only User properties allowed
 *   target: { orderNumber: 'ORD-123' }, // Only Order properties allowed
 *   relationship: { rating: 5 },        // Only relationship properties allowed
 * };
 * ```
 */
export type TypedRelationshipWhereI<
  SourceProperties,
  TargetProperties,
  RelationshipProperties,
> = {
  source?: WhereParamsI<SourceProperties>;
  target?: WhereParamsI<ExtractPropertiesFromInstance<TargetProperties>>;
  relationship?: WhereParamsI<RelationshipProperties>;
};

// ============ Operator Utilities ============

/**
 * List of all supported operator names.
 * Useful for iteration or validation.
 *
 * @example
 * ```typescript
 * operators.forEach(op => console.log(op));
 * // 'eq', 'in', '_in', 'contains', 'gt', 'gte', 'lt', 'lte', 'ne', 'isNull', 'isNotNull'
 * ```
 */
export const operators = [
  'eq',
  'in',
  '_in',
  'contains',
  'gt',
  'gte',
  'lt',
  'lte',
  'ne',
  'isNull',
  'isNotNull',
] as const;

/**
 * Type guard functions to check if a where value uses a specific operator.
 * Each function narrows the type to the corresponding operator type.
 *
 * @example
 * ```typescript
 * const value: WhereValuesI = { [Op.gt]: 10 };
 *
 * if (isOperator.gt(value)) {
 *   // value is now typed as WhereTypes['Gt']
 *   console.log(value[Op.gt]); // 10
 * }
 * ```
 */
export const isOperator = {
  eq: (value: WhereValuesI): value is WhereTypes['Eq'] =>
    typeof value === 'object' && value !== null && Op.eq in value,
  in: (value: WhereValuesI): value is WhereTypes['In'] =>
    typeof value === 'object' && value !== null && Op.in in value,
  _in: (value: WhereValuesI): value is WhereTypes['_In'] =>
    typeof value === 'object' && value !== null && Op._in in value,
  contains: (value: WhereValuesI): value is WhereTypes['Contains'] =>
    typeof value === 'object' && value !== null && Op.contains in value,
  gt: (value: WhereValuesI): value is WhereTypes['Gt'] =>
    typeof value === 'object' && value !== null && Op.gt in value,
  gte: (value: WhereValuesI): value is WhereTypes['Gte'] =>
    typeof value === 'object' && value !== null && Op.gte in value,
  lt: (value: WhereValuesI): value is WhereTypes['Lt'] =>
    typeof value === 'object' && value !== null && Op.lt in value,
  lte: (value: WhereValuesI): value is WhereTypes['Lte'] =>
    typeof value === 'object' && value !== null && Op.lte in value,
  ne: (value: WhereValuesI): value is WhereTypes['Ne'] =>
    typeof value === 'object' && value !== null && Op.ne in value,
  isNull: (value: WhereValuesI): value is WhereTypes['IsNull'] =>
    typeof value === 'object' && value !== null && Op.isNull in value,
  isNotNull: (value: WhereValuesI): value is WhereTypes['IsNotNull'] =>
    typeof value === 'object' && value !== null && Op.isNotNull in value,
} as const;

/**
 * Checks if a where value uses any operator (as opposed to being a direct value).
 *
 * @param value - The where value to check
 * @returns true if the value contains any Op symbol
 *
 * @example
 * ```typescript
 * isAnyOperator({ [Op.gt]: 10 }); // true
 * isAnyOperator('direct value');  // false
 * isAnyOperator([1, 2, 3]);       // false (array is a direct value, not an operator)
 * ```
 */
export const isAnyOperator = (value: WhereValuesI): boolean =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Op.eq in value ||
    Op.in in value ||
    Op._in in value ||
    Op.contains in value ||
    Op.gt in value ||
    Op.gte in value ||
    Op.lt in value ||
    Op.lte in value ||
    Op.ne in value ||
    Op.isNull in value ||
    Op.isNotNull in value);
