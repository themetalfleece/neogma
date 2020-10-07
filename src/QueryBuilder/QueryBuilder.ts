import {
    NeogmaModel,
    Where,
    BindParam,
    WhereParamsI,
    Neo4jSupportedTypes,
    QueryRunner,
} from '..';
import { NeogmaConstraintError } from '../Errors';

export type ParameterI = MatchI | SetI;
type MatchI = {
    match: NodeI & {
        /** optional match */
        optional?: boolean;
    };
};
const isMatchParameter = (param: ParameterI): param is MatchI => {
    return !!(param as MatchI).match;
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

export type NodeI = string | NodeWithModelI | NodeWithLabelI;
type NodeWithModelI = {
    identifier: string;
    model: NeogmaModel<any, any>;
    where?: WhereParamsI;
};
const isNodeWithModelI = (node: NodeI): node is NodeWithModelI => {
    return !!(node as NodeWithModelI).model;
};
type NodeWithLabelI = {
    identifier: string;
    label: string;
    where?: WhereParamsI;
};
const isNodeWithLabelI = (node: NodeI): node is NodeWithLabelI => {
    return !!(node as NodeWithLabelI).label;
};

export class QueryBuilder {
    private parameters: ParameterI[];
    private statement: string;
    private bindParam: BindParam = new BindParam({});

    constructor(parameters: QueryBuilder['parameters']) {
        this.parameters = parameters;

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
            if (isMatchParameter(param)) {
                statementParts.push(this.getMatchString(param.match));
            } else if (isSetParameter(param)) {
                statementParts.push(this.getSetString(param.set));
            }
        }

        // join the statement parts and trim all whitespace
        this.statement = statementParts.join('\n').replace(/\s+/g, ' ');
    }

    private getNodeString(node: NodeI): string {
        if (typeof node === 'string') {
            return node;
        }

        if (typeof node.identifier === 'string') {
            let where: Where;

            if (node.where) {
                where = new Where(
                    {
                        [node.identifier]: node.where,
                    },
                    this.bindParam,
                );
            }

            let label: string;
            if (isNodeWithLabelI(node)) {
                label = node.label;
            } else if (isNodeWithModelI(node)) {
                label = node.model.getLabel();
            } else {
                throw new NeogmaConstraintError('missing label or model param');
            }

            return `(${node.identifier}:${label}) ${
                where ? `WHERE ${where.statement}` : ''
            }`;
        }
    }

    /** returns a string in the format `MATCH (a:Node) WHERE a.p1 = $v1` */
    private getMatchString(match: MatchI['match']): string {
        return `${match.optional ? 'OPTIONAL' : ''} MATCH ${this.getNodeString(
            match,
        )}`;
    }

    /** returns a string in the format: `SET a.p1 = $v1, a.p2 = $v2` */
    private getSetString(set: SetI['set']): string {
        if (typeof set === 'string') {
            return `SET ${set}`;
        } else {
            return QueryRunner.getSetParts({
                data: set.properties,
                identifier: set.identifier,
                bindParam: this.bindParam,
            }).statement;
        }
    }
}
