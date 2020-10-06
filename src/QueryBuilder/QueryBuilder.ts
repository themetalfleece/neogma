import { NeogmaModel, Where, BindParam, WhereParamsI } from '..';
import { NeogmaConstraintError } from '../Errors';

export interface ParameterI {
    match: NodeI & {
        /** optional match */
        optional?: boolean;
    };
}

export type NodeI = string | NodeWithModelI | NodeWithLabelI;
type NodeWithModelI = {
    identifier: string;
    model: NeogmaModel<any, any>;
    where?: WhereParamsI;
};
type NodeWithLabelI = {
    identifier: string;
    label: string;
    where?: WhereParamsI;
};
const isNodeWithModelI = (node: NodeI): node is NodeWithModelI => {
    return !!(node as NodeWithModelI).model;
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
            if (param.match) {
                statementParts.push(
                    `${
                        param.match.optional ? 'OPTIONAL' : ''
                    } MATCH ${this.getNodeString(param.match)}`,
                );
            }
        }

        // join the statement parts and trim all whitespace
        this.statement = statementParts.join('\n').replace(/\s+/g, ' ');
    }

    private getNodeString(node: NodeI, returnFast?: boolean): string {
        if (typeof node === 'string') {
            if (returnFast) {
                return '';
            }
            return node;
        }

        if (typeof node.identifier === 'string') {
            if (returnFast) {
                return '';
            }
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
            if (isNodeWithModelI(node)) {
                label = node.model.getLabel();
            } else if (isNodeWithLabelI(node)) {
                label = node.label;
            } else {
                throw new NeogmaConstraintError('missing label or model param');
            }

            return `(${node.identifier}:${label}) ${
                where ? `WHERE ${where.statement}` : ''
            }`;
        }
    }
}
