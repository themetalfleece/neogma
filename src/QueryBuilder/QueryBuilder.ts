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
    match: MatchNodeI | MatchRelatedI | MatchMultipleI | MatchLiteralI;
};
const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
};
type MatchNodeI = NodeI & {
    /** optional match */
    optional?: boolean;
};
type MatchRelatedI = {
    related: Array<NodeI | RelationshipI>;
    optional?: boolean;
};
const isMatchRelated = (param: MatchI['match']): param is MatchRelatedI => {
    return !!(param as MatchRelatedI).related;
};
type MatchMultipleI = {
    multiple: NodeI[];
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
    return: string | string[] | ReturnObject;
};
const isReturnParameter = (param: ParameterI): param is ReturnI => {
    return !!(param as ReturnI).return;
};
type ReturnObject = Array<{
    identifier: string;
    property?: string;
}>;
const isReturnObject = (param: ReturnI['return']): param is ReturnObject => {
    return (
        Array.isArray(param) &&
        param.findIndex(
            (v) => typeof v !== 'object' || !(v as ReturnObject[0]).identifier,
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

export type NodeI = string | NodeObjectI;
type NodeObjectI = {
    /** a label to use for this node */
    label?: string;
    /** the model of this node. Automatically sets the "label" field */
    model?: NeogmaModel<any, any>;
    /** identifier for the node */
    identifier?: string;
    /** where parameters for matching this node TODO not needed for create */
    where?: WhereParamsI;
};

type RelationshipI = string | RelationshipObject;
type RelationshipObject = {
    direction: 'in' | 'out' | 'none';
    // TODO needed for create, not needed for match
    name?: string;
    identifier?: string;
    /** where parameters for matching this node TODO not needed for create */
    where?: WhereParamsI;
};
export const isRelationship = (
    _relationship: RelationshipI | NodeI,
): _relationship is RelationshipI => {
    const relationship = _relationship as RelationshipI;
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

    private getNodeString(node: NodeI): string {
        if (typeof node === 'string') {
            return node;
        }

        // else, it's a NodeObjectI
        let where: Where;

        if (node.where) {
            where = new Where(
                {
                    [node.identifier]: node.where,
                },
                this.bindParam,
            );
        }

        const label = node.label || node.model?.getLabel() || '';

        // (identifier: label { where })
        return QueryRunner.getNodeStatement({
            identifier: node.identifier,
            label,
            where,
        });
    }

    private getRelationshipString(relationship: RelationshipI): string {
        if (typeof relationship === 'string') {
            return relationship;
        }

        // else, it's a relationship object
        const { direction, identifier, name } = relationship;
        let where: Where;

        if (relationship.where) {
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
        if (isMatchMultiple(match)) {
            const nodeStrings: string[] = [];

            for (const element of match.multiple) {
                nodeStrings.push(this.getNodeString(element));
            }

            return [
                match.optional ? 'OPTIONAL' : '',
                'MATCH',
                nodeStrings.join(', '),
            ].join(' ');
        } else if (isMatchRelated(match)) {
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
        } else if (isMatchLiteral(match)) {
            return [
                match.optional ? 'OPTIONAL' : '',
                `MATCH ${this.getNodeString(match.literal)}`,
            ].join(' ');
        } else {
            // node
            return [
                match.optional ? 'OPTIONAL' : '',
                `MATCH ${this.getNodeString(match)}`,
            ].join(' ');
        }
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
