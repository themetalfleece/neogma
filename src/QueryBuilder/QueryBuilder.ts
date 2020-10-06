import { NeogmaModel } from '..';

export interface ParameterI {
    match: NodeI;
}

export type NodeI =
    | string
    | {
          identifier: string;
          model: NeogmaModel<any, any>;
      };

export class QueryBuilder {
    private parameters: ParameterI[];
    private statement: string;

    constructor(parameters: QueryBuilder['parameters']) {
        this.parameters = parameters;

        this.setStatementByParameters();
    }

    public getStatement(): QueryBuilder['statement'] {
        return this.statement;
    }

    private setStatementByParameters() {
        const statementParts = [];

        for (const param of this.parameters) {
            if (this.isNode(param.match)) {
                statementParts.push(this.getNodeString(param.match));
            }
        }

        this.statement = statementParts.join('\n');
    }

    private isNode(node: any) {
        return !!this.getNodeString(node);
    }

    private getNodeString(node: NodeI) {
        if (typeof node === 'string') {
            return node;
        }
        if (
            typeof node.identifier === 'string' &&
            typeof node.model === 'object'
        ) {
            return `(${node.identifier}:${node.model.getLabel()})`;
        }
    }
}
