import { Where, WhereParamsByIdentifierI, WhereParamsI } from '../Where';
import { Neo4jSupportedProperties, NeogmaModel } from '../..';

/** returns the given type, while making the given properties required */
type RequiredProperties<T, P extends keyof T> = T &
    {
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
    | null
    | undefined;

/** raw string to be used as is in the query */
export type RawI = {
    /** will used as is in the query */
    raw: string;
};
export const isRawParameter = (param: ParameterI): param is RawI => {
    return !!(param as RawI).raw;
};

/** MATCH parameter */
export type MatchI = {
    /** MATCH parameter */
    match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
export const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
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
    return !!(param as MatchRelatedI).related;
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
    return !!(param as MatchMultipleI).multiple;
};
/** a literal string for matching */
export type MatchLiteralI = {
    /** literal string */
    literal: string;
    /** optional match */
    optional?: string;
};
export const isMatchLiteral = (
    param: MatchI['match'],
): param is MatchLiteralI => {
    return !!(param as MatchLiteralI).literal;
};

/** CREATE parameter */
export type CreateI = {
    /** CREATE parameter */
    create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isCreateParameter = (param: ParameterI): param is CreateI => {
    return !!(param as CreateI).create;
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
    return !!(param as CreateRelatedI).related;
};
/** creating multiple nodes */
export type CreateMultipleI = {
    /** multiple nodes */
    multiple: NodeForCreateI[];
};
export const isCreateMultiple = (
    param: CreateI['create'],
): param is CreateMultipleI => {
    return !!(param as CreateMultipleI).multiple;
};

/** MERGE parameter. Using the same types as CREATE */
export type MergeI = {
    /** MERGE parameter. Using the same types as CREATE */
    merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isMergeParameter = (param: ParameterI): param is MergeI => {
    return !!(param as MergeI).merge;
};

/** DELETE parameter */
export type DeleteI = {
    /** DELETE parameter */
    delete: string | DeleteByIdentifierI | DeleteLiteralI;
};
export const isDeleteParameter = (param: ParameterI): param is DeleteI => {
    return !!(param as DeleteI).delete;
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
    const param = _param as DeleteByIdentifierI;
    return !!param.identifiers;
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
    const param = _param as DeleteLiteralI;
    return !!param.literal;
};

/** SET parameter */
export type SetI = {
    /** SET parameter */
    set: string | SetObjectI;
};
export const isSetParameter = (param: ParameterI): param is SetI => {
    return !!(param as SetI).set;
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
    return !!(param as RemoveI).remove;
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
    const param = _param as RemovePropertiesI;
    return !!(param.properties && param.identifier);
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
    const param = _param as RemoveLabelsI;
    return !!(param.labels && param.identifier);
};

/** RETURN parameter */
export type ReturnI = {
    /** RETURN parameter */
    return: string | string[] | ReturnObjectI;
};
export const isReturnParameter = (param: ParameterI): param is ReturnI => {
    return !!(param as ReturnI).return;
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
    return !!(limit as LimitI).limit;
};

/** SKIP parameter */
export type SkipI = { skip: string | number };
export const isSkipParameter = (skip: ParameterI): skip is SkipI => {
    return !!(skip as SkipI).skip;
};

/** WITH parameter */
export type WithI = { with: string | string[] };
export const isWithParameter = (wth: ParameterI): wth is WithI => {
    return !!(wth as WithI).with;
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
    return !!(orderBy as OrderByI).orderBy;
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
    return !!(unwind as UnwindI).unwind;
};

/** WHERE parameter */
export type WhereI = {
    /** WHERE parameter */
    where: string | Where | WhereParamsByIdentifierI;
};
export const isWhereParameter = (where: ParameterI): where is WhereI => {
    return !!(where as WhereI).where;
};

/** FOR EACH parameter */
export type ForEachI = {
    /** FOR EACH parameter */
    forEach: string;
};
export const isForEachParameter = (
    forEach: ParameterI,
): forEach is ForEachI => {
    return !!(forEach as ForEachI).forEach;
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
    return !!(node as NodeForMatchObjectI).where;
};
export const isNodeWithLabel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithLabelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithLabelI).label;
};
export const isNodeWithModel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateWithModelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithModelI).model;
};

export const isNodeWithProperties = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is RequiredProperties<NodeForCreateObjectI, 'properties'> => {
    return !!(node as NodeForCreateObjectI).properties;
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
};
export const isRelationshipWithWhere = (
    relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<RelationshipForMatchObjectI, 'where'> => {
    return !!(relationship as RelationshipForMatchObjectI).where;
};
export const isRelationshipWithProperties = (
    relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RequiredProperties<
    RelationshipForCreateObjectI,
    'properties'
> => {
    return !!(relationship as RelationshipForCreateObjectI).properties;
};
export const isRelationship = (
    _relationship: RelationshipForMatchI | NodeForMatchI,
): _relationship is RelationshipForMatchI => {
    const relationship = _relationship as RelationshipForMatchI;
    return typeof relationship === 'string' || !!relationship.direction;
};
