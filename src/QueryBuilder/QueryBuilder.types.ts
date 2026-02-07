import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
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
  if (typeof param !== 'object' || param === null || !('raw' in param)) {
    return false;
  }
  const raw = (param as RawI).raw;
  return typeof raw === 'string' && raw.length > 0;
};

/** MATCH parameter */
export type MatchI = {
  /** MATCH parameter */
  match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
export const isMatchParameter = (param: ParameterI): param is MatchI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'match')) {
    return false;
  }
  const match = (param as MatchI).match;
  // match can be string or object (MatchNodeI, MatchRelatedI, etc.)
  return (
    (typeof match === 'string' && match.length > 0) ||
    (typeof match === 'object' && match !== null)
  );
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
/**
 * Type guard for MatchRelatedI.
 * @throws NeogmaConstraintError if 'related' key exists but is not an array
 */
export const isMatchRelated = (
  param: MatchI['match'],
): param is MatchRelatedI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('related' in param)) {
    return false;
  }
  // Key exists - validate it's an array
  if (!Array.isArray((param as MatchRelatedI).related)) {
    throw new NeogmaConstraintError(
      `Invalid 'related' value: expected an array, got ${typeof (param as MatchRelatedI).related}`,
    );
  }
  return true;
};
/** matching multiple nodes */
export type MatchMultipleI = {
  /** multiple nodes */
  multiple: NodeForMatchI[];
  /** optional match */
  optional?: boolean;
};
/**
 * Type guard for MatchMultipleI.
 * @throws NeogmaConstraintError if 'multiple' key exists but is not an array
 */
export const isMatchMultiple = (
  param: MatchI['match'],
): param is MatchMultipleI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('multiple' in param)) {
    return false;
  }
  // Key exists - validate it's an array
  if (!Array.isArray((param as MatchMultipleI).multiple)) {
    throw new NeogmaConstraintError(
      `Invalid 'multiple' value: expected an array, got ${typeof (param as MatchMultipleI).multiple}`,
    );
  }
  return true;
};
/** a literal string for matching */
export type MatchLiteralI = {
  /** literal string */
  literal: string;
  /** optional match */
  optional?: boolean;
};
/**
 * Type guard for MatchLiteralI.
 * @throws NeogmaConstraintError if 'literal' key exists but is not a non-empty string
 */
export const isMatchLiteral = (
  param: MatchI['match'],
): param is MatchLiteralI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('literal' in param)) {
    return false;
  }
  // Key exists - validate it's a non-empty string
  const literal = (param as MatchLiteralI).literal;
  if (typeof literal !== 'string' || literal.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'literal' value: expected a non-empty string, got ${typeof literal === 'string' ? 'empty string' : typeof literal}`,
    );
  }
  return true;
};

/** CREATE parameter */
export type CreateI = {
  /** CREATE parameter */
  create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isCreateParameter = (param: ParameterI): param is CreateI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'create')) {
    return false;
  }
  const create = (param as CreateI).create;
  return (
    (typeof create === 'string' && create.length > 0) ||
    (typeof create === 'object' && create !== null)
  );
};
/** creating a node */
export type CreateNodeI = NodeForCreateI;
/** creating a combination of related nodes and relationships */
export type CreateRelatedI = {
  /** combination of related nodes and relationships */
  related: Array<Partial<NodeForCreateI> | RelationshipForCreateI>;
};
/**
 * Type guard for CreateRelatedI.
 * @throws NeogmaConstraintError if 'related' key exists but is not an array
 */
export const isCreateRelated = (
  param: CreateI['create'],
): param is CreateRelatedI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('related' in param)) {
    return false;
  }
  // Key exists - validate it's an array
  if (!Array.isArray((param as CreateRelatedI).related)) {
    throw new NeogmaConstraintError(
      `Invalid 'related' value: expected an array, got ${typeof (param as CreateRelatedI).related}`,
    );
  }
  return true;
};
/** creating multiple nodes */
export type CreateMultipleI = {
  /** multiple nodes */
  multiple: NodeForCreateI[];
};
/**
 * Type guard for CreateMultipleI.
 * @throws NeogmaConstraintError if 'multiple' key exists but is not an array
 */
export const isCreateMultiple = (
  param: CreateI['create'],
): param is CreateMultipleI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!('multiple' in param)) {
    return false;
  }
  // Key exists - validate it's an array
  if (!Array.isArray((param as CreateMultipleI).multiple)) {
    throw new NeogmaConstraintError(
      `Invalid 'multiple' value: expected an array, got ${typeof (param as CreateMultipleI).multiple}`,
    );
  }
  return true;
};

/** MERGE parameter. Using the same types as CREATE */
export type MergeI = {
  /** MERGE parameter. Using the same types as CREATE */
  merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isMergeParameter = (param: ParameterI): param is MergeI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'merge')) {
    return false;
  }
  const merge = (param as MergeI).merge;
  return (
    (typeof merge === 'string' && merge.length > 0) ||
    (typeof merge === 'object' && merge !== null)
  );
};

/** DELETE parameter */
export type DeleteI = {
  /** DELETE parameter */
  delete: string | DeleteByIdentifierI | DeleteLiteralI;
};
export const isDeleteParameter = (param: ParameterI): param is DeleteI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'delete')) {
    return false;
  }
  const del = (param as DeleteI).delete;
  return (
    (typeof del === 'string' && del.length > 0) ||
    (typeof del === 'object' && del !== null)
  );
};
/** deletes the given identifiers */
export type DeleteByIdentifierI = {
  /** identifiers to be deleted */
  identifiers: string | string[];
  /** detach delete */
  detach?: boolean;
};
/**
 * Type guard for DeleteByIdentifierI.
 * @throws NeogmaConstraintError if identifiers key exists but has invalid type/value
 */
export const isDeleteWithIdentifier = (
  _param: DeleteI['delete'],
): _param is DeleteByIdentifierI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('identifiers' in _param)) {
    return false;
  }
  // Key exists - validate it's a non-empty string or non-empty array of non-empty strings
  const identifiers = (_param as DeleteByIdentifierI).identifiers;
  if (typeof identifiers === 'string') {
    if (identifiers.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'identifiers' value: expected a non-empty string, got empty string`,
      );
    }
    return true;
  }
  if (Array.isArray(identifiers)) {
    if (identifiers.length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'identifiers' value: expected a non-empty array, got empty array`,
      );
    }
    const invalidIdx = identifiers.findIndex(
      (id) => typeof id !== 'string' || id.trim().length === 0,
    );
    if (invalidIdx >= 0) {
      throw new NeogmaConstraintError(
        `Invalid 'identifiers' value: array element at index ${invalidIdx} is not a valid non-empty string`,
      );
    }
    return true;
  }
  throw new NeogmaConstraintError(
    `Invalid 'identifiers' value: expected a string or array, got ${typeof identifiers}`,
  );
};
/** deletes by using the given literal */
export type DeleteLiteralI = {
  /** delete literal */
  literal: string;
  /** detach delete */
  detach?: boolean;
};
/**
 * Type guard for DeleteLiteralI.
 * @throws NeogmaConstraintError if literal key exists but has invalid type/value
 */
export const isDeleteWithLiteral = (
  _param: DeleteI['delete'],
): _param is DeleteLiteralI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('literal' in _param)) {
    return false;
  }
  // Key exists - validate it's a non-empty string
  const literal = (_param as DeleteLiteralI).literal;
  if (typeof literal !== 'string' || literal.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'literal' value: expected a non-empty string, got ${typeof literal === 'string' ? 'empty string' : typeof literal}`,
    );
  }
  return true;
};

/** SET parameter */
export type SetI = {
  /** SET parameter */
  set: string | SetObjectI;
};
/**
 * Type guard for SetI.
 * @throws NeogmaConstraintError if 'set' key exists but has an invalid value
 */
export const isSetParameter = (param: ParameterI): param is SetI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'set')) {
    return false;
  }
  // Key exists - validate value
  const set = (param as SetI).set;
  if (typeof set === 'string') {
    if (set.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'set' value: expected a non-empty string`,
      );
    }
    return true;
  }
  if (typeof set === 'object' && set !== null) {
    const setObj = set as SetObjectI;
    if (
      typeof setObj.identifier !== 'string' ||
      setObj.identifier.length === 0
    ) {
      throw new NeogmaConstraintError(
        `Invalid 'set' value: 'identifier' must be a non-empty string`,
      );
    }
    if (typeof setObj.properties !== 'object' || setObj.properties === null) {
      throw new NeogmaConstraintError(
        `Invalid 'set' value: 'properties' must be an object`,
      );
    }
    return true;
  }
  throw new NeogmaConstraintError(
    `Invalid 'set' value: expected a string or object, got ${typeof set}`,
  );
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
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'remove')) {
    return false;
  }
  const remove = (param as RemoveI).remove;
  // remove can be non-empty string or object (detailed validation happens in getRemoveString)
  return (
    (typeof remove === 'string' && remove.length > 0) ||
    (typeof remove === 'object' && remove !== null)
  );
};
/** removes properties of an identifier */
export type RemovePropertiesI = {
  /** identifier whose properties will be removed */
  identifier: string;
  /** properties to remove */
  properties: string | string[];
};
/**
 * Type guard for RemovePropertiesI.
 * @throws NeogmaConstraintError if identifier or properties have invalid type/value
 */
export const isRemoveProperties = (
  _param: RemoveI['remove'],
): _param is RemovePropertiesI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('properties' in _param) || !('identifier' in _param)) {
    return false;
  }
  const { identifier, properties } = _param as RemovePropertiesI;
  // Validate identifier is non-empty string
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'identifier' value: expected a non-empty string, got ${typeof identifier === 'string' ? 'empty string' : typeof identifier}`,
    );
  }
  // Validate properties is non-empty string or non-empty array of non-empty strings
  if (typeof properties === 'string') {
    if (properties.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'properties' value: expected a non-empty string, got empty string`,
      );
    }
    return true;
  }
  if (Array.isArray(properties)) {
    if (properties.length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'properties' value: expected a non-empty array, got empty array`,
      );
    }
    const invalidIdx = properties.findIndex(
      (p) => typeof p !== 'string' || p.trim().length === 0,
    );
    if (invalidIdx >= 0) {
      throw new NeogmaConstraintError(
        `Invalid 'properties' value: array element at index ${invalidIdx} is not a valid non-empty string`,
      );
    }
    return true;
  }
  throw new NeogmaConstraintError(
    `Invalid 'properties' value: expected a string or array, got ${typeof properties}`,
  );
};
/** removes labels of an identifier */
export type RemoveLabelsI = {
  /** identifier whose labels will be removed */
  identifier: string;
  /** labels to remove */
  labels: string | string[];
};
/**
 * Type guard for RemoveLabelsI.
 * @throws NeogmaConstraintError if identifier or labels have invalid type/value
 */
export const isRemoveLabels = (
  _param: RemoveI['remove'],
): _param is RemoveLabelsI => {
  if (typeof _param !== 'object' || _param === null) {
    return false;
  }
  if (!('labels' in _param) || !('identifier' in _param)) {
    return false;
  }
  const { identifier, labels } = _param as RemoveLabelsI;
  // Validate identifier is non-empty string
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'identifier' value: expected a non-empty string, got ${typeof identifier === 'string' ? 'empty string' : typeof identifier}`,
    );
  }
  // Validate labels is non-empty string or non-empty array of non-empty strings
  if (typeof labels === 'string') {
    if (labels.trim().length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'labels' value: expected a non-empty string, got empty string`,
      );
    }
    return true;
  }
  if (Array.isArray(labels)) {
    if (labels.length === 0) {
      throw new NeogmaConstraintError(
        `Invalid 'labels' value: expected a non-empty array, got empty array`,
      );
    }
    const invalidIdx = labels.findIndex(
      (l) => typeof l !== 'string' || l.trim().length === 0,
    );
    if (invalidIdx >= 0) {
      throw new NeogmaConstraintError(
        `Invalid 'labels' value: array element at index ${invalidIdx} is not a valid non-empty string`,
      );
    }
    return true;
  }
  throw new NeogmaConstraintError(
    `Invalid 'labels' value: expected a string or array, got ${typeof labels}`,
  );
};

/** RETURN parameter */
export type ReturnI = {
  /** RETURN parameter */
  return: string | string[] | ReturnObjectI;
};
export const isReturnParameter = (param: ParameterI): param is ReturnI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'return')) {
    return false;
  }
  const ret = (param as ReturnI).return;
  // return can be non-empty string
  if (typeof ret === 'string') {
    return ret.length > 0;
  }
  // return can be non-empty array of strings or ReturnObjectI
  if (Array.isArray(ret)) {
    if (ret.length === 0) {
      return false;
    }
    // Check if it's an array of strings or ReturnObjectI
    return ret.every(
      (item) =>
        (typeof item === 'string' && item.length > 0) ||
        (typeof item === 'object' &&
          item !== null &&
          typeof (item as { identifier: string }).identifier === 'string' &&
          (item as { identifier: string }).identifier.length > 0),
    );
  }
  return false;
};
export type ReturnObjectI = Array<{
  /** identifier to return */
  identifier: string;
  /** returns only this property of the identifier */
  property?: string;
}>;
/**
 * Type guard for ReturnObjectI (array of objects with identifier).
 * @throws NeogmaConstraintError if array contains invalid elements
 */
export const isReturnObject = (
  param: ReturnI['return'],
): param is ReturnObjectI => {
  if (!Array.isArray(param)) {
    return false;
  }
  // Check if all elements are objects with valid identifier
  for (let i = 0; i < param.length; i++) {
    const item = param[i];
    if (typeof item === 'string') {
      // String items are valid for string[] return type, not ReturnObjectI
      return false;
    }
    if (typeof item !== 'object' || item === null) {
      throw new NeogmaConstraintError(
        `Invalid return array element at index ${i}: expected an object, got ${item === null ? 'null' : typeof item}`,
      );
    }
    const identifier = (item as ReturnObjectI[0]).identifier;
    if (typeof identifier !== 'string' || identifier.length === 0) {
      throw new NeogmaConstraintError(
        `Invalid return array element at index ${i}: 'identifier' must be a non-empty string`,
      );
    }
  }
  return true;
};

/** LIMIT parameter */
export type LimitI = { limit: string | number };
export const isLimitParameter = (limit: ParameterI): limit is LimitI => {
  if (typeof limit !== 'object' || limit === null) {
    return false;
  }
  if (!Object.hasOwn(limit, 'limit')) {
    return false;
  }
  const val = (limit as LimitI).limit;
  return (typeof val === 'string' && val.length > 0) || typeof val === 'number';
};

/** SKIP parameter */
export type SkipI = { skip: string | number };
export const isSkipParameter = (skip: ParameterI): skip is SkipI => {
  if (typeof skip !== 'object' || skip === null) {
    return false;
  }
  if (!Object.hasOwn(skip, 'skip')) {
    return false;
  }
  const val = (skip as SkipI).skip;
  return (typeof val === 'string' && val.length > 0) || typeof val === 'number';
};

/** WITH parameter */
export type WithI = { with: string | string[] };
export const isWithParameter = (wth: ParameterI): wth is WithI => {
  if (typeof wth !== 'object' || wth === null) {
    return false;
  }
  if (!Object.hasOwn(wth, 'with')) {
    return false;
  }
  const val = (wth as WithI).with;
  if (typeof val === 'string') {
    return val.length > 0;
  }
  if (Array.isArray(val)) {
    return (
      val.length > 0 && val.every((s) => typeof s === 'string' && s.length > 0)
    );
  }
  return false;
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
  if (typeof orderBy !== 'object' || orderBy === null) {
    return false;
  }
  if (!Object.hasOwn(orderBy, 'orderBy')) {
    return false;
  }
  const val = (orderBy as OrderByI).orderBy;
  // orderBy can be non-empty string, array, or OrderByObjectI
  if (typeof val === 'string') {
    return val.length > 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  // OrderByObjectI - must have non-empty identifier
  if (typeof val === 'object' && val !== null) {
    return (
      typeof (val as OrderByObjectI).identifier === 'string' &&
      (val as OrderByObjectI).identifier.length > 0
    );
  }
  return false;
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
  if (typeof unwind !== 'object' || unwind === null) {
    return false;
  }
  if (!Object.hasOwn(unwind, 'unwind')) {
    return false;
  }
  const val = (unwind as UnwindI).unwind;
  if (typeof val === 'string') {
    return val.length > 0;
  }
  // UnwindObjectI - must have non-empty value and as
  if (typeof val === 'object' && val !== null) {
    const obj = val as UnwindObjectI;
    return (
      typeof obj.value === 'string' &&
      obj.value.length > 0 &&
      typeof obj.as === 'string' &&
      obj.as.length > 0
    );
  }
  return false;
};

/** WHERE parameter */
export type WhereI = {
  /** WHERE parameter */
  where: string | Where | WhereParamsByIdentifierI;
};
export const isWhereParameter = (where: ParameterI): where is WhereI => {
  if (typeof where !== 'object' || where === null) {
    return false;
  }
  if (!Object.hasOwn(where, 'where')) {
    return false;
  }
  const val = (where as WhereI).where;
  // where can be non-empty string, Where instance, or WhereParamsByIdentifierI object
  if (typeof val === 'string') {
    return val.length > 0;
  }
  return typeof val === 'object' && val !== null;
};

/** FOR EACH parameter */
export type ForEachI = {
  /** FOR EACH parameter */
  forEach: string;
};
export const isForEachParameter = (
  forEach: ParameterI,
): forEach is ForEachI => {
  if (typeof forEach !== 'object' || forEach === null) {
    return false;
  }
  if (!Object.hasOwn(forEach, 'forEach')) {
    return false;
  }
  const val = (forEach as ForEachI).forEach;
  return typeof val === 'string' && val.length > 0;
};

/** CALL subquery parameter */
export type CallI = {
  /** CALL subquery - wraps the content in CALL { ... } */
  call: string;
};
export const isCallParameter = (call: ParameterI): call is CallI => {
  if (typeof call !== 'object' || call === null) {
    return false;
  }
  if (!Object.hasOwn(call, 'call')) {
    return false;
  }
  const callValue = (call as CallI).call;
  return typeof callValue === 'string' && callValue.trim().length > 0;
};

/** ON CREATE SET parameter type guard */
export const isOnCreateSetParameter = (
  param: ParameterI,
): param is OnCreateSetI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'onCreateSet')) {
    return false;
  }
  const val = (param as OnCreateSetI).onCreateSet;
  if (typeof val === 'string') {
    return val.length > 0;
  }
  // OnCreateSetObjectI - must have non-empty identifier and properties object
  if (typeof val === 'object' && val !== null) {
    const obj = val as OnCreateSetObjectI;
    return (
      typeof obj.identifier === 'string' &&
      obj.identifier.length > 0 &&
      typeof obj.properties === 'object' &&
      obj.properties !== null
    );
  }
  return false;
};

/** ON MATCH SET parameter type guard */
export const isOnMatchSetParameter = (
  param: ParameterI,
): param is OnMatchSetI => {
  if (typeof param !== 'object' || param === null) {
    return false;
  }
  if (!Object.hasOwn(param, 'onMatchSet')) {
    return false;
  }
  const val = (param as OnMatchSetI).onMatchSet;
  if (typeof val === 'string') {
    return val.length > 0;
  }
  // OnMatchSetObjectI - must have non-empty identifier and properties object
  if (typeof val === 'object' && val !== null) {
    const obj = val as OnMatchSetObjectI;
    return (
      typeof obj.identifier === 'string' &&
      obj.identifier.length > 0 &&
      typeof obj.properties === 'object' &&
      obj.properties !== null
    );
  }
  return false;
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
/**
 * Type guard for nodes with a 'where' clause.
 * @throws NeogmaConstraintError if 'where' key exists with a non-object value
 */
export const isNodeWithWhere = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForMatchObjectI, 'where'> => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('where' in node)) {
    return false;
  }
  // Key exists but undefined is valid (optional property not provided)
  if (node.where === undefined) {
    return false;
  }
  // Key exists with a value - validate it's a plain object
  if (!isPlainObject(node.where)) {
    throw new NeogmaConstraintError(
      `Invalid 'where' value: expected a plain object, got ${typeof node.where}`,
    );
  }
  return true;
};
/**
 * Type guard for nodes with a 'label' property.
 * @throws NeogmaConstraintError if 'label' key exists but is not a non-empty string
 */
export const isNodeWithLabel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithLabelI => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('label' in node)) {
    return false;
  }
  const label = (node as NodeForCreateWithLabelI).label;
  // Key exists - validate it's a non-empty string
  if (typeof label !== 'string' || label.trim().length === 0) {
    throw new NeogmaConstraintError(
      `Invalid 'label' value: expected a non-empty string, got ${typeof label === 'string' ? 'empty string' : typeof label}`,
    );
  }
  return true;
};
/**
 * Type guard for nodes with a 'model' property.
 * @throws NeogmaConstraintError if 'model' key exists but is null/undefined
 */
export const isNodeWithModel = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithModelI => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('model' in node)) {
    return false;
  }
  // Key exists - validate it's not null/undefined
  if (node.model == null) {
    throw new NeogmaConstraintError(
      `Invalid 'model' value: expected a NeogmaModel, got ${node.model}`,
    );
  }
  return true;
};

/**
 * Type guard for nodes with a 'properties' property.
 * @throws NeogmaConstraintError if 'properties' key exists with a non-object value
 */
export const isNodeWithProperties = (
  node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForCreateObjectI, 'properties'> => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  if (!('properties' in node)) {
    return false;
  }
  // Key exists but undefined is valid (optional property not provided)
  if (node.properties === undefined) {
    return false;
  }
  // Key exists with a value - validate it's a plain object
  if (!isPlainObject(node.properties)) {
    throw new NeogmaConstraintError(
      `Invalid 'properties' value: expected a plain object, got ${typeof node.properties}`,
    );
  }
  return true;
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
/**
 * Type guard for relationships with a 'where' clause.
 * @throws NeogmaConstraintError if 'where' key exists with a non-object value
 */
export const isRelationshipWithWhere = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<RelationshipForMatchObjectI, 'where'> => {
  if (typeof relationship !== 'object' || relationship === null) {
    return false;
  }
  if (!('where' in relationship)) {
    return false;
  }
  // Key exists but undefined is valid (optional property not provided)
  if (relationship.where === undefined) {
    return false;
  }
  // Key exists with a value - validate it's a plain object
  if (!isPlainObject(relationship.where)) {
    throw new NeogmaConstraintError(
      `Invalid 'where' value: expected a plain object, got ${typeof relationship.where}`,
    );
  }
  return true;
};
/**
 * Type guard for relationships with a 'properties' property.
 * @throws NeogmaConstraintError if 'properties' key exists with a non-object value
 */
export const isRelationshipWithProperties = (
  relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<
  RelationshipForCreateObjectI,
  'properties'
> => {
  if (typeof relationship !== 'object' || relationship === null) {
    return false;
  }
  if (!('properties' in relationship)) {
    return false;
  }
  // Key exists but undefined is valid (optional property not provided)
  if (relationship.properties === undefined) {
    return false;
  }
  // Key exists with a value - validate it's a plain object
  if (!isPlainObject(relationship.properties)) {
    throw new NeogmaConstraintError(
      `Invalid 'properties' value: expected a plain object, got ${typeof relationship.properties}`,
    );
  }
  return true;
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
