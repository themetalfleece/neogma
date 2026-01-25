import type {
  Date as Neo4jDate,
  DateTime as Neo4jDateTime,
  Duration as Neo4jDuration,
  Integer as Neo4jInteger,
  LocalDateTime as Neo4jLocalDateTime,
  LocalTime as Neo4jLocalTime,
  Point as Neo4jPoint,
  Session,
  Time as Neo4jTime,
  Transaction,
} from 'neo4j-driver';

import type { Literal } from '../Literal';

// ============ Neo4j Type Definitions ============

/** the single types that Neo4j supports (not including an array of them) */
export type Neo4jSingleTypes =
  | number
  | Neo4jInteger
  | string
  | boolean
  | Neo4jPoint
  | Neo4jDate
  | Neo4jTime
  | Neo4jLocalTime
  | Neo4jDateTime
  | Neo4jLocalDateTime
  | Neo4jDuration;

/** all the types that Neo4j supports (single or array) */
export type Neo4jSupportedTypes = Neo4jSingleTypes | Neo4jSingleTypes[];

export type Neo4jSupportedProperties = Record<
  string,
  Neo4jSupportedTypes | Literal | undefined
>;

// ============ Session/Transaction Types ============

/** can run queries, is either a Session or a Transaction */
export type Runnable = Session | Transaction;

// ============ Update Operation Types ============

/** symbols for update operations */
const OpRm: unique symbol = Symbol('remove');

export const UpdateOp = {
  remove: OpRm,
} as const;

export type UpdateTypes = {
  Remove: {
    [UpdateOp.remove]: boolean;
  };
};

/** the type for the accepted values for an attribute */
export type UpdateValuesI =
  | Neo4jSupportedTypes
  | UpdateTypes['Remove']
  | Literal
  | undefined;

export type UpdateSupportedProperties = Partial<Record<string, UpdateValuesI>>;

export const updateOperators = ['remove'] as const;

export const isUpdateOperator = {
  remove: (value: UpdateValuesI): value is UpdateTypes['Remove'] =>
    typeof value === 'object' && value !== null && UpdateOp.remove in value,
} as const;

// ============ Relationship Types ============

type AnyObject = Record<string, any>;

/** Imported here to avoid circular dependency - use AnyWhereI from Where module */
type WhereParam = Record<string, Record<string, any>>;

export interface CreateRelationshipParamsI {
  source: {
    label?: string;
    /** identifier to be used in the query. Defaults to the value of QueryRunner.identifiers.createRelationship.source */
    identifier?: string;
  };
  target: {
    label?: string;
    /** identifier to be used in the query. Defaults to the value of QueryRunner.identifiers.createRelationship.target */
    identifier?: string;
  };
  relationship: {
    name: string;
    direction: 'out' | 'in' | 'none';
    /** properties to be set as relationship attributes */
    properties?: AnyObject;
  };
  /** can access query identifiers by setting the "identifier" property of source/target, else by the values of QueryRunner.identifiers.createRelationship */
  where?: WhereParam;
  /** the session or transaction for running this query */
  session?: Runnable | null;
}
