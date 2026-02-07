import type { NeogmaModel } from '../ModelFactory';
import type { Neo4jSupportedProperties } from '../QueryRunner/QueryRunner.types';
import { isPlainObject } from '../utils/object';
import type { Where, WhereParamsByIdentifierI, WhereParamsI } from '../Where';
import type { OnCreateSetI, OnCreateSetObjectI } from './getOnCreateSetString';
import type { OnMatchSetI, OnMatchSetObjectI } from './getOnMatchSetString';

export type {
  OnCreateSetI,
  OnCreateSetObjectI,
  OnMatchSetI,
  OnMatchSetObjectI,
};

/** returns the given type, while making the given properties required */
type RequiredProperties<T, P extends keyof T> = T & {
  [key in P]-?: Required<NonNullable<T[key]>>;
};

export type ParameterI =
  | RawI
  | MatchI
  | CreateI
  | MergeI
  | SetI
  | DeleteI
  | RemoveI
  | ReturnI
  | OrderByI
  | UnwindI
  | ForEachI
  | LimitI
  | SkipI
  | WithI
  | WhereI
  | OnCreateSetI
  | OnMatchSetI
  | CallI
  | null
  | undefined;

/** raw string to be used as is in the query */
export type RawI = {
  /** will used as is in the query */
  raw: string;
};
export const isRawParameter = (param: ParameterI): param is RawI => {
  return typeof param === 'object' && param !== null && 'raw' in param;
};

/** MATCH parameter */
export type MatchI = {
  /** MATCH parameter */
  match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
export const isMatchParameter = (param: ParameterI): param is MatchI => {
  return typeof param === 'object' && param !== null && 'match' in param;
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
export const isMatchRelated = (
  param: MatchI['match'],
): param is MatchRelatedI => {
  return typeof param === 'object' && param !== null && 'related' in param;
};
/** matching multiple nodes */
export type MatchMultipleI = {
  /** multiple nodes */
  multiple: NodeForMatchI[];
  /** optional match */
  optional?: boolean;
};
export const isMatchMultiple = (
  param: MatchI['match'],
): param is MatchMultipleI => {
  return typeof param === 'object' && param !== null && 'multiple' in param;
};
/** a literal string for matching */
export type MatchLiteralI = {
  /** literal string */
  literal: string;
  /** optional match */
  optional?: boolean;
};
export const isMatchLiteral = (
  param: MatchI['match'],
): param is MatchLiteralI => {
  return typeof param === 'object' && param !== null && 'literal' in param;
};

/** CREATE parameter */
export type CreateI = {
  /** CREATE parameter */
  create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isCreateParameter = (param: ParameterI): param is CreateI => {
  return typeof param === 'object' && param !== null && 'create' in param;
};
/** creating a node */
export type CreateNodeI = NodeForCreateI;
/** creating a combination of related nodes and relationships */
export type CreateRelatedI = {
  /** combination of related nodes and relationships */
  related: Array<Partial<NodeForCreateI> | RelationshipForCreateI>;
};
export const isCreateRelated = (
  param: CreateI['create'],
): param is CreateRelatedI => {
  return typeof param === 'object' && param !== null && 'related' in param;
};
/** creating multiple nodes */
export type CreateMultipleI = {
  /** multiple nodes */
  multiple: NodeForCreateI[];
};
export const isCreateMultiple = (
  param: CreateI['create'],
): param is CreateMultipleI => {
  return typeof param === 'object' && param !== null && 'multiple' in param;
};

/** MERGE parameter. Using the same types as CREATE */
export type MergeI = {
  /** MERGE parameter. Using the same types as CREATE */
  merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isMergeParameter = (param: ParameterI): param is MergeI => {
  return typeof param === 'object' && param !== null && 'merge' in param;
};

/** DELETE parameter */
export type DeleteI = {
  /** DELETE parameter */
  delete: string | DeleteByIdentifierI | DeleteLiteralI;
};
export const isDeleteParameter = (param: ParameterI): param is DeleteI => {
  return typeof param === 'object' && param !== null && 'delete' in param;
};
/** deletes the given identifiers */
export type DeleteByIdentifierI = {
  /** identifiers to be deleted */
  identifiers: string | string[];
  /** detach delete */
  detach?: boolean;
};
export const isDeleteWithIdentifier = (
  _param: DeleteI['delete'],
): _param is DeleteByIdentifierI => {
  if (
    typeof _param !== 'object' ||
    _param === null ||
    !('identifiers' in _param)
  ) {
    return false;
  }
  const identifiers = (_param as DeleteByIdentifierI).identifiers;
  if (typeof identifiers === 'string') {
    return identifiers.trim().length > 0;
  }
  if (Array.isArray(identifiers)) {
    return (
      identifiers.length > 0 &&
      identifiers.every((id) => typeof id === 'string' && id.trim().length > 0)
    );
  }
  return false;
};
/** deletes by using the given literal */
export type DeleteLiteralI = {
  /** delete literal */
  literal: string;
  /** detach delete */
  detach?: boolean;
};
export const isDeleteWithLiteral = (
  _param: DeleteI['delete'],
): _param is DeleteLiteralI => {
  return typeof _param === 'object' && _param !== null && 'literal' in _param;
};

/** SET parameter */
export type SetI = {
  /** SET parameter */
  set: string | SetObjectI;
};
export const isSetParameter = (param: ParameterI): param is SetI => {
  return typeof param === 'object' && param !== null && 'set' in param;
};
export type SetObjectI = {
  /** identifier whose properties will be set */
  identifier: string;
  /** properties to set */
  properties: Neo4jSupportedProperties;
};

// REMOVE parameter
export type RemoveI = {
  // REMOVE parameter
  remove: string | RemovePropertiesI | RemoveLabelsI; // TODO also array of Properties|Labels
};
export const isRemoveParameter = (param: ParameterI): param is RemoveI => {
  return typeof param === 'object' && param !== null && 'remove' in param;
};
/** removes properties of an identifier */
export type RemovePropertiesI = {
  /** identifier whose properties will be removed */
  identifier: string;
  /** properties to remove */
  properties: string | string[];
};
export const isRemoveProperties = (
  _param: RemoveI['remove'],
): _param is RemovePropertiesI => {
  if (
    typeof _param !== 'object' ||
    _param === null ||
    !('properties' in _param) ||
    !('identifier' in _param)
  ) {
    return false;
  }
  const { identifier, properties } = _param as RemovePropertiesI;
  // Validate identifier is non-empty string
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    return false;
  }
  // Validate properties is non-empty string or non-empty array of non-empty strings
  if (typeof properties === 'string') {
    return properties.trim().length > 0;
  }
  if (Array.isArray(properties)) {
    return (
      properties.length > 0 &&
      properties.every((p) => typeof p === 'string' && p.trim().length > 0)
    );
  }
  return false;
};
/** removes labels of an identifier */
export type RemoveLabelsI = {
  /** identifier whose labels will be removed */
  identifier: string;
  /** labels to remove */
  labels: string | string[];
};
export const isRemoveLabels = (
  _param: RemoveI['remove'],
): _param is RemoveLabelsI => {
  if (
    typeof _param !== 'object' ||
    _param === null ||
    !('labels' in _param) ||
    !('identifier' in _param)
  ) {
    return false;
  }
  const { identifier, labels } = _param as RemoveLabelsI;
  // Validate identifier is non-empty string
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    return false;
  }
  // Validate labels is non-empty string or non-empty array of non-empty strings
  if (typeof labels === 'string') {
    return labels.trim().length > 0;
  }
  if (Array.isArray(labels)) {
    return (
      labels.length > 0 &&
      labels.every((l) => typeof l === 'string' && l.trim().length > 0)
    );
  }
  return false;
};

/** RETURN parameter */
export type ReturnI = {
  /** RETURN parameter */
  return: string | string[] | ReturnObjectI;
};
export const isReturnParameter = (param: ParameterI): param is ReturnI => {
  return typeof param === 'object' && param !== null && 'return' in param;
};
export type ReturnObjectI = Array<{
  /** identifier to return */
  identifier: string;
  /** returns only this property of the identifier */
  property?: string;
}>;
export const isReturnObject = (
  param: ReturnI['return'],
): param is ReturnObjectI => {
  return (
    Array.isArray(param) &&
    param.findIndex(
      (v) => typeof v !== 'object' || !(v as ReturnObjectI[0]).identifier,
    ) < 0
  );
};

/** LIMIT parameter */
export type LimitI = { limit: string | number };
export const isLimitParameter = (limit: ParameterI): limit is LimitI => {
  return typeof limit === 'object' && limit !== null && 'limit' in limit;
};

/** SKIP parameter */
export type SkipI = { skip: string | number };
export const isSkipParameter = (skip: ParameterI): skip is SkipI => {
  return typeof skip === 'object' && skip !== null && 'skip' in skip;
};

/** WITH parameter */
export type WithI = { with: string | string[] };
export const isWithParameter = (wth: ParameterI): wth is WithI => {
  return typeof wth === 'object' && wth !== null && 'with' in wth;
};

/** ORDER BY parameter */
export type OrderByI = {
  orderBy:
    | string
    | Array<string | [string, 'ASC' | 'DESC'] | OrderByObjectI>
    | OrderByObjectI;
};
export type OrderByObjectI = {
  /** identifier to order */
  identifier: string;
  /** only order this property of the identifier */
  property?: string;
  /** direction of this order */
  direction?: 'ASC' | 'DESC';
};
export const isOrderByParameter = (
  orderBy: ParameterI,
): orderBy is OrderByI => {
  return (
    typeof orderBy === 'object' && orderBy !== null && 'orderBy' in orderBy
  );
};

/** UNWIND parameter */
export type UnwindI = {
  /** UNWIND parameter */
  unwind: string | UnwindObjectI;
};
export type UnwindObjectI = {
  /** value to unwind */
  value: string;
  /** unwind value as this */
  as: string;
};
export const isUnwindParameter = (unwind: ParameterI): unwind is UnwindI => {
  return typeof unwind === 'object' && unwind !== null && 'unwind' in unwind;
};

/** WHERE parameter */
export type WhereI = {
  /** WHERE parameter */
  where: string | Where | WhereParamsByIdentifierI;
};
export const isWhereParameter = (where: ParameterI): where is WhereI => {
  return typeof where === 'object' && where !== null && 'where' in where;
};

/** FOR EACH parameter */
export type ForEachI = {
  /** FOR EACH parameter */
  forEach: string;
};
export const isForEachParameter = (
  forEach: ParameterI,
): forEach is ForEachI => {
  return (
    typeof forEach === 'object' && forEach !== null && 'forEach' in forEach
  );
};

/** CALL subquery parameter */
export type CallI = {
  /** CALL subquery - wraps the content in CALL { ... } */
  call: string;
};
export const isCallParameter = (call: ParameterI): call is CallI => {
  return typeof call === 'object' && call !== null && 'call' in call;
};

/** ON CREATE SET parameter type guard */
export const isOnCreateSetParameter = (
  param: ParameterI,
): param is OnCreateSetI => {
  return typeof param === 'object' && param !== null && 'onCreateSet' in param;
};

/** ON MATCH SET parameter type guard */
export const isOnMatchSetParameter = (
  param: ParameterI,
): param is OnMatchSetI => {
  return typeof param === 'object' && param !== null && 'onMatchSet' in param;
};

/** node type which will be used for matching */
export type NodeForMatchI = string | NodeForMatchObjectI;
export type NodeForMatchObjectI = {
  /** a label to use for this node */
  label?: string;
  /** the model of this node. Automatically sets the "label" field */
  model?: NeogmaModel<any, any, any, any>;
  /** identifier for the node */
  identifier?: string;
  /** where parameters for matching this node */
  where?: WhereParamsI;
};
/** node type which will be used for creating/merging */
export type NodeForCreateI =
  | string
  | NodeForCreateWithLabelI
  | NodeForCreateWithModelI;
export type NodeForCreateObjectI =
  | NodeForCreateWithLabelI
  | NodeForCreateWithModelI;
/** node type used for creating/merging, using a label */
export type NodeForCreateWithLabelI = {
  /** identifier for the node */
  identifier?: string;
  /** a label to use for this node */
  label: string;
  /** properties of the node */
  properties?: Neo4jSupportedProperties;
};
/** node type used for creating/merging, using a model to extract the label */
export type NodeForCreateWithModelI = {
  /** identifier for the node */
  identifier?: string;
  /** the model of this node. Automatically sets the "label" field */
  model: NeogmaModel<any, any, any, any>;
  /** properties of the node */
  properties?: Neo4jSupportedProperties;
};
export const isNodeWithWhere = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForMatchObjectI, 'where'> => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'where' in node &&
    isPlainObject(node.where)
  );
};
export const isNodeWithLabel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithLabelI => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'label' in node &&
    node.label != null
  );
};
export const isNodeWithModel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithModelI => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'model' in node &&
    node.model != null
  );
};

export const isNodeWithProperties = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForCreateObjectI, 'properties'> => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'properties' in node &&
    isPlainObject(node.properties)
  );
};

/** relationship type used for matching */
export type RelationshipForMatchI = string | RelationshipForMatchObjectI;
export type RelationshipForMatchObjectI = {
  /** direction of this relationship, from top to bottom */
  direction: 'in' | 'out' | 'none';
  /** name of this relationship */
  name?: string;
  /** identifier for this relationship */
  identifier?: string;
  /** where parameters for matching this relationship */
  where?: WhereParamsI;
  /** variable length relationship: minimum hops */
  minHops?: number;
  /** variable length relationship: maximum hops */
  maxHops?: number;
};
/** relationship type used for creating/merging */
export type RelationshipForCreateI = string | RelationshipForCreateObjectI;
export type RelationshipForCreateObjectI = {
  /** direction of this relationship, from top to bottom */
  direction: 'in' | 'out' | 'none';
  /** name of this relationship */
  name: string;
  /** identifier for this relationship */
  identifier?: string;
  /** properties of the relationship */
  properties?: Neo4jSupportedProperties;
  /** variable length relationship: minimum hops */
  minHops?: number;
  /** variable length relationship: maximum hops. The value Infinity can be used for no limit on the max hops */
  maxHops?: number;
};
export const isRelationshipWithWhere = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<RelationshipForMatchObjectI, 'where'> => {
  return (
    typeof relationship === 'object' &&
    relationship !== null &&
    'where' in relationship &&
    isPlainObject(relationship.where)
  );
};
export const isRelationshipWithProperties = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<
  RelationshipForCreateObjectI,
  'properties'
> => {
  return (
    typeof relationship === 'object' &&
    relationship !== null &&
    'properties' in relationship &&
    isPlainObject(relationship.properties)
  );
};
export const isRelationship = (
  _relationship: RelationshipForMatchI | NodeForMatchI,
): _relationship is RelationshipForMatchI => {
  return (
    typeof _relationship === 'string' ||
    (typeof _relationship === 'object' &&
      _relationship !== null &&
      'direction' in _relationship)
  );
};
