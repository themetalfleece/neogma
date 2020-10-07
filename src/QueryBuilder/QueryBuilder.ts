import {
    NeogmaModel,
    Where,
    BindParam,
    WhereParamsI,
    Neo4jSupportedTypes,
    QueryRunner,
} from '..';

export type ParameterI = RawI | MatchI | SetI | DeleteI | RemoveI;

type RawI = {
    raw: string;
};
const isRawParameter = (param: ParameterI): param is RawI => {
    return !!(param as RawI).raw;
};

type MatchI = {
    match:
        | (NodeI & {
              /** optional match */
              optional?: boolean;
          })
        | Array<NodeI | RelationshipI>;
};
const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
};

type DeleteI = {
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

type SetI = {
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

export type NodeI = string | NodeObjectI | NodeWithLiteralI;
const isNode = (node: MatchI['match']): node is NodeI => {
    return typeof node === 'string' || !Array.isArray(node);
};
type NodeObjectI = {
    /** a label to use for this node */
    label?: string;
    /** the model of this node. Automatically sets the "label" field */
    model?: NeogmaModel<any, any>;
    /** identifier for the node */
    identifier?: string;
    /** where parameters for matching this node */
    where?: WhereParamsI;
};
type NodeWithLiteralI = {
    literal: string;
};
const isNodeWithLiteral = (_node: NodeI): _node is NodeWithLiteralI => {
    const node = _node as NodeWithLiteralI;
    return !!node.literal;
};

type RelationshipI =
    | string
    | {
          direction: 'in' | 'out' | 'none';
          // TODO needed for create, not needed for match
          name?: string;
          identifier?: string;
          /** where parameters for matching this node */
          where?: WhereParamsI;
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
            }
        }

        // join the statement parts and trim all whitespace
        this.statement = statementParts.join('\n').replace(/\s+/g, ' ');
    }

    private getNodeString(node: NodeI): string {
        if (typeof node === 'string') {
            return node;
        }

        if (isNodeWithLiteral(node)) {
            return node.literal;
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

        const label = node.label || node.model.getLabel();

        // TODO use getNodeData which does all those in a single call - also in other parts of the app
        return `(${QueryRunner.getIdentifierWithLabel(
            node.identifier,
            label,
        )} ${where?.getStatement('object')})`;
    }

    /** returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
    private getMatchString(match: MatchI['match']): string {
        if (isNode(match)) {
            return `${
                match.optional ? 'OPTIONAL ' : ''
            }MATCH ${this.getNodeString(match)}`;
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
}
