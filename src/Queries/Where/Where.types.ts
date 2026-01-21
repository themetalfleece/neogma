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
 * Its keys are the identifier attributes for the where, and the values are the values for that attribute
 */
export interface WhereParamsI {
  /** the attribute and values for an identifier */
  [attribute: string]: WhereValuesI;
}

/**
 * an object with the query identifiers as keys and the attributes+types as value
 */
export interface WhereParamsByIdentifierI {
  /** the identifiers to use */
  [identifier: string]: WhereParamsI;
}

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
