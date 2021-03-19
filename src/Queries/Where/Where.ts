import { BindParam } from '../BindParam/BindParam';
import {
    Neo4jSingleTypes,
    Neo4jSupportedTypes,
} from '../QueryRunner/QueryRunner';
import { neo4jDriver } from '../..';
import { NeogmaConstraintError } from '../../Errors';

/** symbols for Where operations */
const OpIn: unique symbol = Symbol('in');
const OpContains: unique symbol = Symbol('contains');
export const Op = {
    in: OpIn,
    contains: OpContains,
} as const;

/** the type to be used for "in" */
interface WhereInI {
    [Op.in]: Neo4jSingleTypes[];
}

interface WhereContainsI {
    [Op.contains]: string;
}

const isWhereIn = (value: WhereValuesI): value is WhereInI => {
    return value?.[Op.in];
};

const isWhereContains = (value: WhereValuesI): value is WhereContainsI => {
    return value?.[Op.contains];
};

const isNeo4jSupportedTypes = (
    value: WhereValuesI,
): value is Neo4jSupportedTypes => {
    const isSupportedSingleType = (value: WhereValuesI): boolean => {
        return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            neo4jDriver.isInt(value) ||
            neo4jDriver.isPoint(value) ||
            neo4jDriver.isDate(value) ||
            neo4jDriver.isTime(value) ||
            neo4jDriver.isLocalTime(value) ||
            neo4jDriver.isDateTime(value) ||
            neo4jDriver.isLocalDateTime(value) ||
            neo4jDriver.isDuration(value)
        );
    };

    if (Array.isArray(value)) {
        return value.every((element) => isSupportedSingleType(element));
    }

    return isSupportedSingleType(value);
};

/** the type for the accepted values for an attribute */
export type WhereValuesI = Neo4jSupportedTypes | WhereInI | WhereContainsI;

/**
 * an object to be used for a query identifier
 * Its keys are the identifier attributes for the where, and the values are the values for that attribute
 */
export interface WhereParamsI {
    /** the attribute and values for an identifier */
    [attribute: string]: WhereValuesI;
}

/**
 * an object with the query identifiers as keys and the attributes+types as value
 */
export interface WhereParamsByIdentifierI {
    /** the identifiers to use */
    [identifier: string]: WhereParamsI;
}

/** a Where instance or the basic object which can create a Where instance */
export type AnyWhereI = WhereParamsByIdentifierI | Where;

export class Where {
    /** where bind params. Ensures that keys of the bind param are unique */
    private bindParam: BindParam;
    /** all the given options, so we can easily combine them into a new statement */
    private rawParams: WhereParamsByIdentifierI[] = [];
    /**
     * an object with the key being the `identifier.property` and the value being the the bind param name which corresponds to it, and an operator to be used in the statement
     * this is needed for the following reasons:
     * 1) when generating the statement, those values are used
     * 2) the bind param names which are generated from this Where need to be differentiated from the actual keys of the bindParam, since this Where can only remove those
     */
    private identifierPropertyData: Array<{
        identifier: string;
        property: string;
        bindParamName: string;
        operator: 'equals' | 'in' | 'contains';
    }> = [];

    constructor(
        /** the where parameters to use */
        whereParams: Parameters<Where['addParams']>[0],
        /** an existing bind param to be used, so the properties can be merged. If empty, a new one will be created and used */
        bindParam?: BindParam,
    ) {
        this.bindParam = BindParam.acquire(bindParam);
        this.addParams(whereParams);

        Object.setPrototypeOf(this, Where.prototype);
    }

    /** gets the BindParam used in this Where */
    public getBindParam(): BindParam {
        return this.bindParam;
    }

    /** gets the raw where parameters used to generate the final result */
    public getRawParams(): Where['rawParams'] {
        return this.rawParams;
    }

    /** refreshes the statement and the bindParams by the given where params */
    public addParams(
        /** the where parameters to use */
        whereParams: WhereParamsByIdentifierI,
    ): Where {
        // push the latest whereParams to the end of the array
        this.rawParams.push(whereParams);

        /* set the identifierPropertyData field by the rawParams */

        // merge all rawParams, for each identifier, into a single one. That way, the latest rawOption will dictate its properties if some previous ones have a common key
        const params: WhereParamsByIdentifierI = {};
        for (const rawParam of this.rawParams) {
            for (const [identifier, value] of Object.entries(rawParam)) {
                params[identifier] = { ...params[identifier], ...value };
            }
        }

        // remove all used bind param names from the bind param, since we're gonna set them again from scratch
        this.bindParam.remove(
            this.identifierPropertyData.map(
                ({ bindParamName }) => bindParamName,
            ),
        );
        // reset identifierPropertyData as they've been removed from the bindParam
        this.identifierPropertyData = [];

        for (const nodeIdentifier in params) {
            for (const property in params[nodeIdentifier]) {
                const value = params[nodeIdentifier][property];

                if (isNeo4jSupportedTypes(value)) {
                    this.addBindParamDataEntry({
                        identifier: nodeIdentifier,
                        property,
                        value,
                        operator: 'equals',
                    });
                } else if (isWhereIn(value)) {
                    this.addBindParamDataEntry({
                        identifier: nodeIdentifier,
                        property,
                        value: value[Op.in],
                        operator: 'in',
                    });
                } else if (isWhereContains(value)) {
                    this.addBindParamDataEntry({
                        identifier: nodeIdentifier,
                        property,
                        value: value[Op.contains],
                        operator: 'contains',
                    });
                }
            }
        }

        return this;
    }

    /** adds a value to the bind param, while updating the usedBindParamNames field appropriately */
    private addBindParamDataEntry = ({
        identifier,
        property,
        operator,
        value,
    }: {
        identifier: string;
        property: string;
        operator: Where['identifierPropertyData'][0]['operator'];
        value: Neo4jSupportedTypes;
    }) => {
        const bindParamName = this.bindParam.getUniqueNameAndAdd(
            property,
            value,
        );
        this.identifierPropertyData.push({
            identifier,
            property,
            bindParamName,
            operator,
        });
    };

    /** gets the statement by the params */
    public getStatement = (
        /**
         * text is in the format "a.p1 = $v1 AND a.p2 = $v2"
         * object is in the format "{ a.p1 = $v1, a.p2 = $v2 }"
         */
        mode: 'object' | 'text',
    ): string => {
        const statementParts: string[] = [];

        const operatorForStatement = (
            operator: Where['identifierPropertyData'][0]['operator'],
        ) => {
            if (mode === 'object') {
                if (operator !== 'equals') {
                    throw new NeogmaConstraintError(
                        'The only operator which is supported for object mode is "equals"',
                        {
                            actual: {
                                mode,
                                operator,
                            },
                        },
                    );
                }

                // : is the only operator used in object mode
                return ':';
            }

            const textMap: Record<
                Where['identifierPropertyData'][0]['operator'],
                string
            > = {
                equals: '=',
                in: 'IN',
                contains: 'CONTAINS',
            };

            // else, return the appropriate text-mode operator
            return textMap[operator];
        };

        if (mode === 'text') {
            for (const bindParamData of this.identifierPropertyData) {
                statementParts.push(
                    [
                        `${bindParamData.identifier}.${bindParamData.property}`,
                        operatorForStatement(bindParamData.operator),
                        `$${bindParamData.bindParamName}`,
                    ].join(' '),
                );
            }

            return statementParts.join(' AND ');
        }

        if (mode === 'object') {
            for (const bindParamData of this.identifierPropertyData) {
                statementParts.push(
                    [
                        bindParamData.property,
                        operatorForStatement(bindParamData.operator),
                        ` $${bindParamData.bindParamName}`,
                    ].join(''),
                );
            }

            return `{ ${statementParts.join(', ')} }`;
        }

        throw new NeogmaConstraintError(`invalid mode ${mode}`);
    };

    /** returns a Where object if params is specified, else returns null */
    public static acquire(
        params?: AnyWhereI | null,
        bindParam?: BindParam,
    ): Where | null {
        if (!params) {
            return null;
        }

        if (params instanceof Where) {
            return params;
        }

        return new Where(params, bindParam);
    }

    /**
     * if the value is not an array, it gets returned as is. If it's an array, a "[Op.in]" object is returned for that value
     */
    public static ensureIn(value: WhereValuesI): WhereValuesI {
        return value instanceof Array
            ? {
                  [Op.in]: value,
              }
            : value;
    }
}
