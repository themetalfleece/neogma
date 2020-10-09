import {
    NeogmaModel,
    Where,
    BindParam,
    WhereParamsI,
    Neo4jSupportedTypes,
    QueryRunner,
} from '..';
import { NeogmaConstraintError } from '../Errors';

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
const isRawParameter = (param: ParameterI): param is RawI => {
    return !!(param as RawI).raw;
};

export type MatchI = {
    match: string | MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
};
type MatchNodeI = NodeForMatchI & {
    /** optional match */
    optional?: boolean;
};
type MatchRelatedI = {
    related: Array<NodeForMatchI | RelationshipForMatchI>;
    optional?: boolean;
};
const isMatchRelated = (param: MatchI['match']): param is MatchRelatedI => {
    return !!(param as MatchRelatedI).related;
};
type MatchMultipleI = {
    multiple: NodeForMatchI[];
    optional?: boolean;
};
const isMatchMultiple = (param: MatchI['match']): param is MatchMultipleI => {
    return !!(param as MatchMultipleI).multiple;
};
type MatchLiteralI = {
    literal: string;
    optional?: string;
};
const isMatchLiteral = (param: MatchI['match']): param is MatchLiteralI => {
    return !!(param as MatchLiteralI).literal;
};

export type CreateI = {
    create: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
const isCreateParameter = (param: ParameterI): param is CreateI => {
    return !!(param as CreateI).create;
};
type CreateNodeI = NodeForCreateI;
type CreateRelatedI = {
    related: Array<NodeForCreateI | RelationshipForCreateI>;
};
const isCreateRelated = (param: CreateI['create']): param is CreateRelatedI => {
    return !!(param as CreateRelatedI).related;
};
type CreateMultipleI = {
    multiple: NodeForCreateI[];
};
const isCreateMultiple = (
    param: CreateI['create'],
): param is CreateMultipleI => {
    return !!(param as CreateMultipleI).multiple;
};

export type MergeI = {
    merge: string | CreateNodeI | CreateRelatedI | CreateMultipleI;
};
const isMergeParameter = (param: ParameterI): param is MergeI => {
    return !!(param as MergeI).merge;
};

export type DeleteI = {
    delete: string | DeleteWithIdentifierI | DeleteWithLiteralI;
};
const isDeleteParameter = (param: ParameterI): param is DeleteI => {
    return !!(param as DeleteI).delete;
};
type DeleteWithIdentifierI = {
    identifiers: string | string[];
    /** detach delete */
    detach?: boolean;
};
const isDeleteWithIdentifier = (
    _param: DeleteI['delete'],
): _param is DeleteWithIdentifierI => {
    const param = _param as DeleteWithIdentifierI;
    return !!param.identifiers;
};
type DeleteWithLiteralI = {
    literal: string;
    /** detach delete */
    detach?: boolean;
};
const isDeleteWithLiteral = (
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
const isSetParameter = (param: ParameterI): param is SetI => {
    return !!(param as SetI).set;
};

type RemoveI = {
    remove: string | RemovePropertiesI | RemoveLabelsI;
};
const isRemoveParameter = (param: ParameterI): param is RemoveI => {
    return !!(param as RemoveI).remove;
};
type RemovePropertiesI = {
    identifier: string;
    properties: string | string[];
};
const isRemoveProperties = (
    _param: RemoveI['remove'],
): _param is RemovePropertiesI => {
    const param = _param as RemovePropertiesI;
    return !!(param.properties && param.identifier);
};
type RemoveLabelsI = {
    identifier: string;
    labels: string | string[];
};
const isRemoveLabels = (_param: RemoveI['remove']): _param is RemoveLabelsI => {
    const param = _param as RemoveLabelsI;
    return !!(param.labels && param.identifier);
};

export type ReturnI = {
    return: string | string[] | ReturnObjectI;
};
const isReturnParameter = (param: ParameterI): param is ReturnI => {
    return !!(param as ReturnI).return;
};
type ReturnObjectI = Array<{
    identifier: string;
    property?: string;
}>;
const isReturnObject = (param: ReturnI['return']): param is ReturnObjectI => {
    return (
        Array.isArray(param) &&
        param.findIndex(
            (v) => typeof v !== 'object' || !(v as ReturnObjectI[0]).identifier,
        ) < 0
    );
};

export type LimitI = { limit: string | number };
const isLimitParameter = (limit: ParameterI): limit is LimitI => {
    return !!(limit as LimitI).limit;
};

export type WithI = { with: string | string[] };
const isWithParameter = (wth: ParameterI): wth is WithI => {
    return !!(wth as WithI).with;
};

type NodeForMatchI = string | NodeForMatchObjectI;
type NodeForMatchObjectI = {
    /** a label to use for this node */
    label?: string;
    /** the model of this node. Automatically sets the "label" field */
    model?: NeogmaModel<any, any>;
    /** identifier for the node */
    identifier?: string;
    /** where parameters for matching this node */
    where?: WhereParamsI;
};
// TODO add and use properties
type NodeForCreateI =
    | string
    | NodeForCreateWithLabelI
    | NodeForCreateWithModelI;
type NodeForCreateObjectI = NodeForCreateWithLabelI | NodeForCreateWithModelI;
type NodeForCreateWithLabelI = {
    /** identifier for the node */
    identifier?: string;
    /** a label to use for this node */
    label: string;
};
type NodeForCreateWithModelI = {
    /** identifier for the node */
    identifier?: string;
    /** the model of this node. Automatically sets the "label" field */
    model: NeogmaModel<any, any>;
};
const isNodeWithWhere = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI => {
    return !!(node as NodeForMatchObjectI).where;
};
const isNodeWithLabel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI | NodeForCreateWithLabelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithLabelI).label;
};
const isNodeWithModel = (
    node: NodeForMatchObjectI | NodeForCreateObjectI,
): node is NodeForMatchObjectI | NodeForCreateWithModelI => {
    return !!(node as NodeForMatchObjectI | NodeForCreateWithModelI).model;
};

type RelationshipForMatchI = string | RelationshipForMatchObjectI;
type RelationshipForMatchObjectI = {
    direction: 'in' | 'out' | 'none';
    name?: string;
    identifier?: string;
    /** where parameters for matching this node */
    where?: WhereParamsI;
};
type RelationshipForCreateI = string | RelationshipForCreateObjectI;
type RelationshipForCreateObjectI = {
    direction: 'in' | 'out' | 'none';
    name: string;
    identifier?: string;
};
const isRelationshipWithWhere = (
    relationship: RelationshipForMatchI | RelationshipForCreateI,
): relationship is RelationshipForMatchI => {
    return (
        typeof relationship === 'object' &&
        !!(relationship as RelationshipForMatchObjectI).where
    );
};
const isRelationship = (
    _relationship: RelationshipForMatchI | NodeForMatchI,
): _relationship is RelationshipForMatchI => {
    const relationship = _relationship as RelationshipForMatchI;
    return typeof relationship === 'string' || !!relationship.direction;
};

export class QueryBuilder {
    private parameters: ParameterI[];
    private statement: string;
    private bindParam: BindParam;

    constructor(
        parameters: QueryBuilder['parameters'],
        config?: {
            bindParam: BindParam;
        },
    ) {
        this.parameters = parameters;

        this.bindParam = config?.bindParam || new BindParam({});

        this.setStatementByParameters();
    }

    public getStatement(): QueryBuilder['statement'] {
        return this.statement;
    }

    public getBindParam(): QueryBuilder['bindParam'] {
        return this.bindParam;
    }

    private setStatementByParameters() {
        const statementParts: string[] = [];

        for (const param of this.parameters) {
            if (isRawParameter(param)) {
                statementParts.push(param.raw);
            } else if (isMatchParameter(param)) {
                statementParts.push(this.getMatchString(param.match));
            } else if (isCreateParameter(param)) {
                statementParts.push(
                    this.getCreateOrMergeString(param.create, 'create'),
                );
            } else if (isMergeParameter(param)) {
                statementParts.push(
                    this.getCreateOrMergeString(param.merge, 'merge'),
                );
            } else if (isSetParameter(param)) {
                statementParts.push(this.getSetString(param.set));
            } else if (isDeleteParameter(param)) {
                statementParts.push(this.getDeleteString(param.delete));
            } else if (isRemoveParameter(param)) {
                statementParts.push(this.getRemoveString(param.remove));
            } else if (isReturnParameter(param)) {
                statementParts.push(this.getReturnString(param.return));
            } else if (isLimitParameter(param)) {
                statementParts.push(this.getLimitString(param.limit));
            } else if (isWithParameter(param)) {
                statementParts.push(this.getWithString(param.with));
            }
        }

        // join the statement parts and trim all whitespace
        this.statement = statementParts.join('\n').replace(/\s+/g, ' ');
    }

    private getNodeString(node: NodeForMatchI | NodeForCreateI): string {
        if (typeof node === 'string') {
            return node;
        }

        // else, it's a NodeObjectI
        let where: Where;

        if (isNodeWithWhere(node)) {
            where = new Where(
                {
                    [node.identifier]: node.where,
                },
                this.bindParam,
            );
        }

        let label = '';
        if (isNodeWithLabel(node)) {
            label = node.label;
        } else if (isNodeWithModel(node)) {
            label = node.model.getLabel();
        }

        // (identifier: label { where })
        return QueryRunner.getNodeStatement({
            identifier: node.identifier,
            label,
            where,
        });
    }

    private getRelationshipString(
        relationship: RelationshipForMatchI | RelationshipForCreateI,
    ): string {
        if (typeof relationship === 'string') {
            return relationship;
        }

        // else, it's a relationship object
        const { direction, identifier, name } = relationship;
        let where: Where;

        if (isRelationshipWithWhere(relationship)) {
            where = new Where(
                {
                    [identifier]: relationship.where,
                },
                this.bindParam,
            );
        }

        return QueryRunner.getRelationshipStatement({
            direction,
            identifier,
            name,
            where,
        });
    }

    /** returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
    private getMatchString(match: MatchI['match']): string {
        if (typeof match === 'string') {
            return `MATCH ${match}`;
        }

        if (isMatchMultiple(match)) {
            return [
                match.optional ? 'OPTIONAL' : '',
                'MATCH',
                match.multiple
                    .map((element) => this.getNodeString(element))
                    .join(', '),
            ].join(' ');
        }

        if (isMatchRelated(match)) {
            // every even element is a node, every odd element is a relationship
            const parts: string[] = [];

            for (let index = 0; index < match.related.length; index++) {
                const element = match.related[index];
                if (index % 2) {
                    // even, parse as relationship
                    if (!isRelationship(element)) {
                        throw new NeogmaConstraintError(
                            'even argument of related is not a relationship',
                        );
                    }
                    parts.push(this.getRelationshipString(element));
                } else {
                    // odd, parse as node
                    parts.push(this.getNodeString(element));
                }
            }

            return [
                match.optional ? 'OPTIONAL' : '',
                'MATCH',
                parts.join(''),
            ].join(' ');
        }

        if (isMatchLiteral(match)) {
            return [
                match.optional ? 'OPTIONAL' : '',
                `MATCH ${this.getNodeString(match.literal)}`,
            ].join(' ');
        }

        // else, is a node
        return [
            match.optional ? 'OPTIONAL' : '',
            `MATCH ${this.getNodeString(match)}`,
        ].join(' ');
    }

    private getCreateOrMergeString(
        create: CreateI['create'],
        mode: 'create' | 'merge',
    ): string {
        const createOrMerge = mode === 'merge' ? 'MERGE' : 'CREATE';

        if (typeof create === 'string') {
            return `${createOrMerge} ${create}`;
        }

        if (isCreateMultiple(create)) {
            return [
                createOrMerge,
                create.multiple
                    .map((element) => this.getNodeString(element))
                    .join(', '),
            ].join(' ');
        }

        if (isCreateRelated(create)) {
            // every even element is a node, every odd element is a relationship
            const parts: string[] = [];

            for (let index = 0; index < create.related.length; index++) {
                const element = create.related[index];
                if (index % 2) {
                    // even, parse as relationship
                    if (!isRelationship(element)) {
                        throw new NeogmaConstraintError(
                            'even argument of related is not a relationship',
                        );
                    }
                    parts.push(this.getRelationshipString(element));
                } else {
                    // odd, parse as node
                    parts.push(this.getNodeString(element));
                }
            }

            return [createOrMerge, parts.join('')].join(' ');
        }

        // else, is a node
        if (isNodeWithLabel(create)) {
            return [
                createOrMerge,
                this.getNodeString({
                    identifier: create.identifier,
                    label: create.label,
                }),
            ].join(' ');
        }
        if (isNodeWithModel(create)) {
            return [
                createOrMerge,
                this.getNodeString({
                    identifier: create.identifier,
                    model: create.model,
                }),
            ].join(' ');
        }

        throw new NeogmaConstraintError('Invanid create parameter', {
            actual: create,
        });
    }

    /** returns a string in the format: `SET a.p1 = $v1, a.p2 = $v2` */
    private getSetString(set: SetI['set']): string {
        if (typeof set === 'string') {
            return `SET ${set}`;
        }

        return QueryRunner.getSetParts({
            data: set.properties,
            identifier: set.identifier,
            bindParam: this.bindParam,
        }).statement;
    }

    private getDeleteString(dlt: DeleteI['delete']): string {
        if (typeof dlt === 'string') {
            return `DELETE ${dlt}`;
        }

        if (isDeleteWithIdentifier(dlt)) {
            const identifiers = Array.isArray(dlt.identifiers)
                ? dlt.identifiers
                : [dlt.identifiers];

            return `${dlt.detach ? 'DETACH ' : ''}DELETE ${identifiers.join(
                ', ',
            )}`;
        }

        if (isDeleteWithLiteral(dlt)) {
            return `${dlt.detach ? 'DETACH ' : ''}DELETE ${dlt.literal}`;
        }
    }

    private getRemoveString(remove: RemoveI['remove']): string {
        if (typeof remove === 'string') {
            return `REMOVE ${remove}`;
        }

        if (isRemoveProperties(remove)) {
            const properties = Array.isArray(remove.properties)
                ? remove.properties
                : [remove.properties];
            const propertiesWithIdentifier = properties.map(
                (p) => `${remove.identifier}.${p}`,
            );
            return `REMOVE ${propertiesWithIdentifier.join(', ')}`;
        }

        if (isRemoveLabels(remove)) {
            const labels = Array.isArray(remove.labels)
                ? remove.labels
                : [remove.labels];
            return `REMOVE ${remove.identifier}:${labels.join(':')}`;
        }
    }

    private getReturnString(rtn: ReturnI['return']): string {
        if (typeof rtn === 'string') {
            return `RETURN ${rtn}`;
        }

        if (isReturnObject(rtn)) {
            const returnString = rtn
                .map(
                    (v) =>
                        `${v.identifier}${v.property ? '.' + v.property : ''}`,
                )
                .join(', ');

            return `RETURN ${returnString}`;
        }

        // else string array
        return `RETURN ${rtn.join(', ')}`;
    }

    private getLimitString(limit: LimitI['limit']): string {
        return `LIMIT ${limit}`;
    }

    private getWithString(wth: WithI['with']): string {
        const wthArr = Array.isArray(wth) ? wth : [wth];

        return `WITH ${wthArr.join(', ')}`;
    }
}
