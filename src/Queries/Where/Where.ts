import { BindParam } from '../BindParam/BindParam';
import {
    Neo4jSingleTypes,
    Neo4jSupportedTypes,
} from '../QueryRunner/QueryRunner';
import { neo4jDriver } from '../..';
import { NeogmaConstraintError } from '../../Errors';
import { Literal } from '../Literal';

/** symbols for Where operations */
const OpEq: unique symbol = Symbol('eq');
const OpIn: unique symbol = Symbol('in');
const OpContains: unique symbol = Symbol('contains');
const OpGt: unique symbol = Symbol('gt');
const OpGte: unique symbol = Symbol('gte');
const OpLt: unique symbol = Symbol('lt');
const OpLte: unique symbol = Symbol('lte');
const OpNe: unique symbol = Symbol('ne');
export const Op = {
    eq: OpEq,
    in: OpIn,
    contains: OpContains,
    gt: OpGt,
    gte: OpGte,
    lt: OpLt,
    lte: OpLte,
    ne: OpNe,
} as const;

type WhereTypes = {
    Eq: {
        [Op.eq]: Neo4jSingleTypes | Literal;
    };
    Ne: {
        [Op.ne]: Neo4jSingleTypes | Literal;
    };
    In: {
        [Op.in]: Neo4jSingleTypes[] | Literal;
    };
    Contains: {
        [Op.contains]: Neo4jSingleTypes | Literal;
    };
    Gt: {
        [Op.gt]: Neo4jSingleTypes | Literal;
    };
    Gte: {
        [Op.gte]: Neo4jSingleTypes | Literal;
    };
    Lt: {
        [Op.lt]: Neo4jSingleTypes | Literal;
    };
    Lte: {
        [Op.lte]: Neo4jSingleTypes | Literal;
    };
};

const operators = [
    'eq',
    'in',
    'contains',
    'gt',
    'gte',
    'lt',
    'lte',
    'ne',
] as const;

const isOperator = {
    eq: (value: WhereValuesI): value is WhereTypes['Eq'] =>
        typeof value === 'object' && value && Op.eq in value,
    in: (value: WhereValuesI): value is WhereTypes['In'] =>
        typeof value === 'object' && value && Op.in in value,
    contains: (value: WhereValuesI): value is WhereTypes['Contains'] =>
        typeof value === 'object' && value && Op.contains in value,
    gt: (value: WhereValuesI): value is WhereTypes['Gt'] =>
        typeof value === 'object' && value && Op.gt in value,
    gte: (value: WhereValuesI): value is WhereTypes['Gte'] =>
        typeof value === 'object' && value && Op.gte in value,
    lt: (value: WhereValuesI): value is WhereTypes['Lt'] =>
        typeof value === 'object' && value && Op.lt in value,
    lte: (value: WhereValuesI): value is WhereTypes['Lte'] =>
        typeof value === 'object' && value && Op.lte in value,
    ne: (value: WhereValuesI): value is WhereTypes['Ne'] =>
        typeof value === 'object' && value && Op.ne in value,
} as const;

/** the type for the accepted values for an attribute */
export type WhereValuesI =
    | Neo4jSupportedTypes
    | WhereTypes['Eq']
    | WhereTypes['In']
    | WhereTypes['Contains']
    | WhereTypes['Gt']
    | WhereTypes['Gte']
    | WhereTypes['Lt']
    | WhereTypes['Lte']
    | WhereTypes['Ne']
    | Literal;

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

const isNeo4jSupportedTypes = (
    value: WhereValuesI,
): value is Neo4jSupportedTypes => {
    const isSupportedSingleType = (value: WhereValuesI): boolean => {
        return (
            value instanceof Literal ||
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
        bindParamName: string | Literal;
        operator: typeof operators[number];
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
            this.identifierPropertyData
                .map(({ bindParamName }) => bindParamName)
                .filter((v) => typeof v === 'string') as string[],
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
                        operator: 'eq',
                    });
                } else if (value !== null && value !== undefined) {
                    for (const operator of operators) {
                        if (isOperator[operator](value)) {
                            this.addBindParamDataEntry({
                                identifier: nodeIdentifier,
                                property,
                                value: value[Op[operator]],
                                operator,
                            });
                            break;
                        }
                    }
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
        const bindParamName = this.bindParam.getUniqueNameAndAddWithLiteral(
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
                if (operator !== 'eq') {
                    throw new NeogmaConstraintError(
                        'The only operator which is supported for object mode is "eq"',
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
                eq: '=',
                in: 'IN',
                contains: 'CONTAINS',
                gt: '>',
                gte: '>=',
                lt: '<',
                lte: '<=',
                ne: '<>',
            };

            // else, return the appropriate text-mode operator
            return textMap[operator];
        };

        if (mode === 'text') {
            for (const bindParamData of this.identifierPropertyData) {
                const { bindParamName } = bindParamData;
                const name =
                    bindParamName instanceof Literal
                        ? bindParamName.getValue()
                        : `$${bindParamName}`;
                statementParts.push(
                    [
                        `${bindParamData.identifier}.${bindParamData.property}`,
                        operatorForStatement(bindParamData.operator),
                        name,
                    ].join(' '),
                );
            }

            return statementParts.join(' AND ');
        }

        if (mode === 'object') {
            for (const bindParamData of this.identifierPropertyData) {
                const { bindParamName } = bindParamData;
                const name =
                    bindParamName instanceof Literal
                        ? bindParamName.getValue()
                        : `$${bindParamName}`;
                statementParts.push(
                    [
                        bindParamData.property,
                        operatorForStatement(bindParamData.operator),
                        ` ${name}`,
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
