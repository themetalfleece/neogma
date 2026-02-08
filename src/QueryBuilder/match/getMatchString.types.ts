import type { BindParam } from '../../BindParam';
import type { NodeForMatchI, RelationshipForMatchI } from '../shared';

export type GetMatchStringMatch = MatchI['match'];

export interface GetMatchStringDeps {
  bindParam: BindParam;
  getBindParam: () => BindParam;
}

/** MATCH parameter */
export type MatchI = {
  /** MATCH parameter */
  match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};

/** matching a single node */
export type MatchNodeI = NodeForMatchI & {
  /** optional match */
  optional?: boolean;
};

/** matching a combination of related nodes and relationships */
export type MatchRelatedI = {
  /** combination of related nodes and relationships */
  related: Array<NodeForMatchI | RelationshipForMatchI>;
  /** optional match */
  optional?: boolean;
};

/** matching multiple nodes */
export type MatchMultipleI = {
  /** multiple nodes */
  multiple: NodeForMatchI[];
  /** optional match */
  optional?: boolean;
};

/** a literal string for matching */
export type MatchLiteralI = {
  /** literal string */
  literal: string;
  /** optional match */
  optional?: boolean;
};
