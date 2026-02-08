import type { BindParam } from '../../BindParam';
import type { Where } from '../../Where';
import type {
  RelationshipForCreateI,
  RelationshipForMatchI,
} from '../QueryBuilder.types';

export type GetRelationshipStringRelationship =
  | RelationshipForMatchI
  | RelationshipForCreateI;

export interface GetRelationshipStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}

/** Result of getRelationshipString containing the statement and optional standalone WHERE clause */
export interface GetRelationshipStringResult {
  /** The relationship pattern string like "-[r:REL { prop: $val }]->" */
  statement: string;
  /** Where instance for non-eq operators that need a separate WHERE clause, or null if none */
  standaloneWhere: Where | null;
}
