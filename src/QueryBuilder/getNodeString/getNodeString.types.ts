import type { BindParam } from '../../BindParam';
import type { Where } from '../../Where';
import type { NodeForCreateI, NodeForMatchI } from '../QueryBuilder.types';

export type GetNodeStringNode = NodeForMatchI | NodeForCreateI;

export interface GetNodeStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}

/** Result of getNodeString containing the statement and optional standalone WHERE clause */
export interface GetNodeStringResult {
  /** The node pattern string like "(n:Label { prop: $val })" */
  statement: string;
  /** Where instance for non-eq operators that need a separate WHERE clause, or null if none */
  standaloneWhere: Where | null;
}
