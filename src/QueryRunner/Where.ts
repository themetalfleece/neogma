import * as clone from 'clone';
import { Neo4JJayConstraintError } from 'errors/Neo4JJayConstraintError';
import { StringSequence } from '../utils/StringSequence';

/**
 * the bind param which should be passed to a query. It throws an error if more than one of each key is added
 */
export class BindParam {
    /** acquires a BindParam, so it ensures that a BindParam is always returned. If it's passed, it will be returned as is. Else, a new one will be created and returned */
    public static acquire(bindParam: BindParam | null) {
        if (bindParam) { return bindParam; }
        return new BindParam();
    }

    /** the object with the bind param */
    private bind: Record<string, any>;

    constructor(...objects: Array<BindParam['bind']>) {
        this.bind = {};
        this.add(...objects);
    }

    /**
     * adds objects to the bind attribute, throwing an error if a given key already exists in the bind param
     */
    public add(...objects: Array<BindParam['bind']>) {
        for (const object of objects) {
            for (const key in object) {
                if (!object.hasOwnProperty(key)) { continue; }
                if (this.bind.hasOwnProperty(key)) {
                    throw new Neo4JJayConstraintError(`key ${key} already in the bind param`);
                }
                this.bind[key] = object[key];
            }
        }

        return this;
    }

    /**
     * returns a new BindParam instance with a clone of the bind property
     */
    public clone() {
        return new BindParam(clone(this.get()));
    }

    /**
     * returns the bind attribute
     */
    public get() {
        return this.bind;
    }

    /** returns a name which isn't a key of bind, and starts with the suffix */
    public getUniqueName(suffix: string): string {
        if (!this.bind.hasOwnProperty(suffix)) {
            return suffix;
        } else {
            const stringSequence = new StringSequence('a', 'zzzz', 4);
            while (true) {
                const newKey = suffix + '__' + stringSequence.getNextString(true);
                if (!this.bind.hasOwnProperty(newKey)) {
                    return newKey;
                }
            }
        }
    }

    /** returns a name which isn't a key of bind and adds the value to the bind param with the created name */
    public getUniqueNameAndAdd(
        suffix: Parameters<typeof BindParam['prototype']['getUniqueName']>[0],
        value: Parameters<typeof BindParam['prototype']['add']>[0][0]
    ): string {
        const name = this.getUniqueName(suffix);
        this.add({
            [name]: value,
        });
        return name;
    }
}

export interface WhereStatementI {
    /** the where statent string to be used in the query */
    statement: string;
    /** the params of the values associated with the statement, to be used as query parameters */
    bindParam?: BindParam;
}

/** passing an array directly as an value also works, i.e. { primes: [2, 3, 5, 7] } */
interface WhereInI {
    in: Array<string | number>;
}

const isWhereIn = (value: WhereAttributesI): value is WhereInI => {
    return (value as any).in;
};

type WhereAttributesI = string | number | boolean | Array<string | number> | WhereInI;

interface WhereParamsI {
    /** the labels to use */
    [label: string]: {
        /** the keys of those labels */
        [key: string]: WhereAttributesI;
    };
}

/**
 * returns a "where" string statement to be placed in a query, along with a BindParam. Ensures that keys of the bind param are unique
 */
export const getWhere = (
    options: WhereParamsI,
    /** an existing bind param for the name/value to be added. If empty, a new one will be created and returned */
    _bindParam?: BindParam,
): WhereStatementI => {
    let statement: WhereStatementI['statement'] = '';

    const bindParam = BindParam.acquire(_bindParam);

    /** generates a variable name, adds the value to the params under this name and returns it */
    const getNameAndAddToParams = (prefix, value: string | number | boolean | object) => {
        const name = bindParam.getUniqueNameAndAdd(prefix, value);
        return `{${name}}`;
    };

    /** adds a value to the statement by prepending AND if the statement already has a value */
    const addAnd = (value: string) => {
        if (!statement) {
            statement += value;
        } else {
            statement += ` AND ${value}`;
        }
    };

    for (const nodeAlias in options) {
        if (!options.hasOwnProperty(nodeAlias)) { continue; }
        for (const key in options[nodeAlias]) {
            if (!options[nodeAlias].hasOwnProperty(key)) { continue; }

            const value = options[nodeAlias][key];

            if (['string', 'number', 'boolean', 'array'].includes(typeof value)) {
                // in case of an array, use the IN operand
                const operand = value instanceof Array ? 'IN' : '=';
                addAnd(`${nodeAlias}.${key} ${operand} ${getNameAndAddToParams(key, value)}`);
            } else if (isWhereIn(value)) {
                addAnd(`${nodeAlias}.${key} IN ${getNameAndAddToParams(key, value.in)}`);
            }
        }
    }

    return {
        statement,
        bindParam,
    };
};
