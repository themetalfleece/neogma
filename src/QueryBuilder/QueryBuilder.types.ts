import { Neo4jSupportedTypes, NeogmaModel, WhereParamsI } from '..';

export type ParameterI =
    | RawI
    | MatchI
    | CreateI
    | MergeI
    | SetI
    | DeleteI
    | RemoveI
    | ReturnI
    | LimitI
    | WithI;

export type RawI = {
    raw: string;
};
export const isRawParameter = (param: ParameterI): param is RawI => {
    return !!(param as RawI).raw;
};

export type MatchI = {
    match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
export const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
};
export type MatchNodeI = NodeForMatchI & {
    /** optional match */
    optional?: boolean;
};
export type MatchRelatedI = {
    related: Array<NodeForMatchI | RelationshipForMatchI>;
    optional?: boolean;
};
export const isMatchRelated = (
    param: MatchI['match'],
): param is MatchRelatedI => {
    return !!(param as MatchRelatedI).related;
};
export type MatchMultipleI = {
    multiple: NodeForMatchI[];
    optional?: boolean;
};
export const isMatchMultiple = (
    param: MatchI['match'],
): param is MatchMultipleI => {
    return !!(param as MatchMultipleI).multiple;
};
export type MatchLiteralI = {
    literal: string;
    optional?: string;
};
export const isMatchLiteral = (
    param: MatchI['match'],
): param is MatchLiteralI => {
    return !!(param as MatchLiteralI).literal;
};

export type CreateI = {
    create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isCreateParameter = (param: ParameterI): param is CreateI => {
    return !!(param as CreateI).create;
};
export type CreateNodeI = NodeForCreateI;
export type CreateRelatedI = {
    related: Array<NodeForCreateI | RelationshipForCreateI>;
};
export const isCreateRelated = (
    param: CreateI['create'],
): param is CreateRelatedI => {
    return !!(param as CreateRelatedI).related;
};
export type CreateMultipleI = {
    multiple: NodeForCreateI[];
};
export const isCreateMultiple = (
    param: CreateI['create'],
): param is CreateMultipleI => {
    return !!(param as CreateMultipleI).multiple;
};

export type MergeI = {
    merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
export const isMergeParameter = (param: ParameterI): param is MergeI => {
    return !!(param as MergeI).merge;
};

export type DeleteI = {
    delete: string | DeleteWithIdentifierI | DeleteWithLiteralI;
};
export const isDeleteParameter = (param: ParameterI): param is DeleteI => {
    return !!(param as DeleteI).delete;
};
export type DeleteWithIdentifierI = {
    identifiers: string | string[];
    /** detach delete */
    detach?: boolean;
};
export const isDeleteWithIdentifier = (
    _param: DeleteI['delete'],
): _param is DeleteWithIdentifierI => {
    const param = _param as DeleteWithIdentifierI;
    return !!param.identifiers;
};
export type DeleteWithLiteralI = {
    literal: string;
    /** detach delete */
    detach?: boolean;
};
export const isDeleteWithLiteral = (
    _param: DeleteI['delete'],
): _param is DeleteWithLiteralI => {
    const param = _param as DeleteWithLiteralI;
    return !!param.literal;
};

export type SetI = {
    set:
        | string
        | {
              identifier: string;
              properties: Record<string, Neo4jSupportedTypes>;
          };
};
export const isSetParameter = (param: ParameterI): param is SetI => {
    return !!(param as SetI).set;
};

export type RemoveI = {
    remove: string | RemovePropertiesI | RemoveLabelsI;
};
export const isRemoveParameter = (param: ParameterI): param is RemoveI => {
    return !!(param as RemoveI).remove;
};
export type RemovePropertiesI = {
    identifier: string;
    properties: string | string[];
};
export const isRemoveProperties = (
    _param: RemoveI['remove'],
): _param is RemovePropertiesI => {
    const param = _param as RemovePropertiesI;
    return !!(param.properties && param.identifier);
};
export type RemoveLabelsI = {
    identifier: string;
    labels: string | string[];
};
export const isRemoveLabels = (
    _param: RemoveI['remove'],
): _param is RemoveLabelsI => {
    const param = _param as RemoveLabelsI;
    return !!(param.labels && param.identifier);
};

export type ReturnI = {
    return: string | string[] | ReturnObjectI;
};
export const isReturnParameter = (param: ParameterI): param is ReturnI => {
    return !!(param as ReturnI).return;
};
export type ReturnObjectI = Array<{
    identifier: string;
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

export type LimitI = { limit: string | number };
export const isLimitParameter = (limit: ParameterI): limit is LimitI => {
    return !!(limit as LimitI).limit;
};

export type WithI = { with: string | string[] };
export const isWithParameter = (wth: ParameterI): wth is WithI => {
    return !!(wth as WithI).with;
};

export type NodeForMatchI = string | NodeForMatchObjectI;
export type NodeForMatchObjectI = {
    /** a label to use for this node */
    label?: string;
    /** the model of this node. Automatically sets the "label" field */
    model?: NeogmaModel<any, any>;
    /** identifier for the node */
    identifier?: string;
    /** where parameters for matching this node */
    where?: WhereParamsI;
};
export type NodeForCreateI =
    | string
    | NodeForCreateWithLabelI
    | NodeForCreateWithModelI;
export type NodeForCreateObjectI =
    | NodeForCreateWithLabelI
    | NodeForCreateWithModelI;
export type NodeForCreateWithLabelI = {
    /** identifier for the node */
    identifier?: string;
    /** a label to use for this node */
    label: string;
    /** properties of the node */
    properties?: Record<string, Neo4jSupportedTypes>;
};
export type NodeForCreateWithModelI = {
    /** identifier for the node */
    identifier?: string;
    /** the model of this node. Automatically sets the "label" field */
    model: NeogmaModel<any, any>;
    /** properties of the node */
    properties?: Record<string, Neo4jSupportedTypes>;
};
export const isNodeWithWhere = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI => {
    return !!(node as NodeForMatchObjectI).where;
};
export const isNodeWithLabel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI | NodeForCreateWithLabelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithLabelI).label;
};
export const isNodeWithModel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI | NodeForCreateWithModelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithModelI).model;
};
export const isNodeWithProperties = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForCreateObjectI => {
    return !!(node as NodeForCreateObjectI).properties;
};

export type RelationshipForMatchI = string | RelationshipForMatchObjectI;
export type RelationshipForMatchObjectI = {
    direction: 'in' | 'out' | 'none';
    name?: string;
    identifier?: string;
    /** where parameters for matching this node */
    where?: WhereParamsI;
};
export type RelationshipForCreateI = string | RelationshipForCreateObjectI;
export type RelationshipForCreateObjectI = {
    direction: 'in' | 'out' | 'none';
    name: string;
    identifier?: string;
    /** properties of the relationship */
    properties?: Record<string, Neo4jSupportedTypes>;
};
export const isRelationshipWithWhere = (
    relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RelationshipForMatchObjectI => {
    return !!(relationship as RelationshipForMatchObjectI).where;
};
export const isRelationshipWithProperties = (
    relationship: RelationshipForMatchObjectI | RelationshipForCreateObjectI,
): relationship is RelationshipForCreateObjectI => {
    return !!(relationship as RelationshipForCreateObjectI).properties;
};
export const isRelationship = (
    _relationship: RelationshipForMatchI | NodeForMatchI,
): _relationship is RelationshipForMatchI => {
    const relationship = _relationship as RelationshipForMatchI;
    return typeof relationship === 'string' || !!relationship.direction;
};
