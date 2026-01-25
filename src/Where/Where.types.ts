import { Literal } from '../Literal';
import {
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
} as const;

// ============ Where Type Definitions ============

export type WhereTypes = {
  Eq: {
    [Op.eq]: Neo4jSingleTypes | Literal;
  };
  Ne: {
    [Op.ne]: Neo4jSingleTypes | Literal;
  };
  In: {
    [Op.in]: Neo4jSingleTypes[] | Literal;
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
};

/** the type for the accepted values for an attribute */
export type WhereValuesI =
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
  | Literal;

/**
 * an object to be used for a query identifier
 * Its keys are the identifier attributes for the where, and the values are the values for that attribute.
 * Undefined values are ignored during query building.
 */
export interface WhereParamsI {
  /** the attribute and values for an identifier */
  [attribute: string]: WhereValuesI | undefined;
}

/**
 * an object with the query identifiers as keys and the attributes+types as value
 */
export interface WhereParamsByIdentifierI {
  /** the identifiers to use */
  [identifier: string]: WhereParamsI;
}

// ============ Type-Safe Where Parameters ============

/**
 * Type-safe where value that constrains the value to match the property type.
 * Uses conditional type to fall back to WhereValuesI for unknown types,
 * ensuring compatibility in generic contexts.
 *
 * @typeParam T - The property type to validate against
 *
 * @example
 * ```typescript
 * // For a string property, only string values are allowed:
 * type NameValue = TypedWhereValueI<string>;
 * const valid: NameValue = 'John';           // OK
 * const validOp: NameValue = { [Op.eq]: 'John' }; // OK
 * const invalid: NameValue = 123;            // Error!
 *
 * // For a number property, only number values are allowed:
 * type AgeValue = TypedWhereValueI<number>;
 * const validAge: AgeValue = 25;             // OK
 * const validAgeOp: AgeValue = { [Op.gt]: 18 }; // OK
 * const invalidAge: AgeValue = 'twenty-five'; // Error!
 * ```
 */
export type TypedWhereValueI<T> =
  // Use NonNullable to handle optional properties (T | undefined)
  NonNullable<T> extends Neo4jSingleTypes
    ?
        | NonNullable<T>
        | Array<NonNullable<T>>
        | { [Op.eq]: NonNullable<T> | Literal }
        | { [Op.in]: Array<NonNullable<T>> | Literal }
        | { [Op._in]: NonNullable<T> | Literal }
        | { [Op.contains]: NonNullable<T> | Literal }
        | { [Op.gt]: NonNullable<T> | Literal }
        | { [Op.gte]: NonNullable<T> | Literal }
        | { [Op.lt]: NonNullable<T> | Literal }
        | { [Op.lte]: NonNullable<T> | Literal }
        | { [Op.ne]: NonNullable<T> | Literal }
        | Literal
    : WhereValuesI; // Fallback for unknown/generic types

/**
 * Type-safe where parameters that constrain keys to actual model properties
 * and values to match the property types.
 * This ensures that typos in property names AND incorrect value types are caught at compile time.
 *
 * @typeParam Properties - The type of the model properties to filter by
 *
 * @example
 * ```typescript
 * type UserProps = { id: string; name: string; age: number };
 *
 * // Valid: correct property names and matching value types
 * const where: TypedWhereParamsI<UserProps> = { name: 'John', age: 25 };
 *
 * // Invalid: 'nam' is not a valid property - TypeScript error
 * const invalid1: TypedWhereParamsI<UserProps> = { nam: 'John' }; // Error!
 *
 * // Invalid: age expects number, not string - TypeScript error
 * const invalid2: TypedWhereParamsI<UserProps> = { age: 'twenty-five' }; // Error!
 * ```
 */
export type TypedWhereParamsI<Properties> = {
  [K in keyof Properties]?: TypedWhereValueI<Properties[K]>;
};

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
  source?: TypedWhereParamsI<SourceProperties>;
  target?: TypedWhereParamsI<ExtractPropertiesFromInstance<TargetProperties>>;
  relationship?: TypedWhereParamsI<RelationshipProperties>;
};

// ============ Operator Utilities ============

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
] as const;

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
} as const;
