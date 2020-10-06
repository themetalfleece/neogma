import { BindParam } from './BindParam';
import { Neo4jSingleTypes, Neo4jSupportedTypes } from './QueryRunner';
import { neo4jDriver } from '..';

/** symbols for Where operations */
const OpIn: unique symbol = Symbol('in');
export const Op = {
    in: OpIn,
} as const;

/** the type to be used for "in" */
interface WhereInI {
    [Op.in]: Neo4jSingleTypes[];
}

const isWhereIn = (value: WhereValuesI): value is WhereInI => {
    return value?.[Op.in];
};

const isNeo4jSupportedTypes = (
    value: WhereValuesI,
): value is Neo4jSupportedTypes => {
    const isSupportedSingleType = (value: WhereValuesI): boolean => {
        return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
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
        return (
            value.findIndex((element) => !isSupportedSingleType(element)) === -1
        );
    }

    return isSupportedSingleType(value);
};

/** the type for the accepted values for an attribute */
export type WhereValuesI = Neo4jSupportedTypes | WhereInI;

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
    /** where statement to be placed in a query */
    public statement: string;
    /** where bind params. Ensures that keys of the bind param are unique */
    public bindParam: BindParam;
    /** all the given options, so we can easily combine them into a new statement */
    private rawParams: WhereParamsByIdentifierI[] = [];

    constructor(
        /** the where parameters to use */
        whereParams: Parameters<Where['addParams']>[0],
        /** an existing bind param or where object so the properties can be merged. If empty, a new one will be created and returned */
        bindOrWhere?: Parameters<Where['addParams']>[1],
    ) {
        this.addParams(whereParams, bindOrWhere);
        Object.setPrototypeOf(this, Where.prototype);
    }

    /** refreshes the statement and the bindParams by the given where params */
    public addParams(
        /** the where parameters to use */
        whereParams: WhereParamsByIdentifierI,
        /** an existing bind param or where object so the properties can be merged. If empty, a new one will be created and returned */
        bindOrWhere?: BindParam | Where,
    ): Where {
        this.bindParam = new BindParam();
        if (bindOrWhere instanceof BindParam) {
            this.bindParam = BindParam.acquire(bindOrWhere);
        } else if (bindOrWhere instanceof Where) {
            // push the existing rawParams in order, at the beginning of the array
            this.rawParams.push(...bindOrWhere.rawParams);
        }
        // the the latest whereParams to the end of the array
        this.rawParams.push(whereParams);

        // set the statement and bindParams fields
        this.setFieldsByRawParams();

        return this;
    }

    /** sets the statement, bindParams fields by the rawParams */
    private setFieldsByRawParams() {
        this.statement = '';

        // merge all rawParams into a single one. That way, the latest rawOption will dictate its properties if some previous ones have a common key
        const params: WhereParamsByIdentifierI = Object.assign(
            {},
            ...this.rawParams,
        );

        for (const nodeIdentifier in params) {
            for (const key in params[nodeIdentifier]) {
                const value = params[nodeIdentifier][key];

                if (isNeo4jSupportedTypes(value)) {
                    this.addAnd(
                        `${nodeIdentifier}.${key} = ${this.getNameAndAddToParams(
                            key,
                            value,
                        )}`,
                    );
                } else if (isWhereIn(value)) {
                    this.addAnd(
                        `${nodeIdentifier}.${key} IN ${this.getNameAndAddToParams(
                            key,
                            value[Op.in],
                        )}`,
                    );
                }
            }
        }
    }

    /** generates a variable name, adds the value to the params under this name and returns it to be added directly to a query */
    private getNameAndAddToParams = (prefix, value: Neo4jSupportedTypes) => {
        const name = this.bindParam.getUniqueNameAndAdd(prefix, value);
        return `$${name}`;
    };

    /** adds a value to the statement by prepending AND if the statement already has a value */
    private addAnd = (value: string) => {
        if (!this.statement) {
            this.statement += value;
        } else {
            this.statement += ` AND ${value}`;
        }
    };

    /** returns a Where object if params is specified, else returns null */
    public static acquire(
        params: AnyWhereI,
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
