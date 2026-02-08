import type { BindParam } from '../../BindParam';
import type { NodeForCreateI, RelationshipForCreateI } from '../shared';

/** CREATE parameter */
export type CreateI = {
  /** CREATE parameter */
  create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};

/** creating a node */
export type CreateNodeI = NodeForCreateI;

/** creating a combination of related nodes and relationships */
export type CreateRelatedI = {
  /** combination of related nodes and relationships */
  related: Array<Partial<NodeForCreateI> | RelationshipForCreateI>;
};

/** creating multiple nodes */
export type CreateMultipleI = {
  /** multiple nodes */
  multiple: NodeForCreateI[];
};

/** MERGE parameter. Using the same types as CREATE */
export type MergeI = {
  /** MERGE parameter. Using the same types as CREATE */
  merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};

export type GetCreateOrMergeStringCreate = CreateI['create'];
export type GetCreateOrMergeStringMode = 'create' | 'merge';

export interface GetCreateOrMergeStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}
