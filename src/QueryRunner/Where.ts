export interface WhereStatementI {
    /** the where statent string to be used in the query  */
    statement: string;
    /** the params of the values associated with the statement, to be used as query parameters */
    params: object;
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

/** for the param name generation, so they are all unique TODO string generation */
let currentUniqueNameValue = 0;
const getUniqueNameValue = () => {
    currentUniqueNameValue++;
    // if the current unique name value has reached its limit, reset to 0
    if (!Number.isSafeInteger(currentUniqueNameValue)) {
        currentUniqueNameValue = 0;
    }
    return currentUniqueNameValue;
};

export const getWhere = (options: WhereParamsI): WhereStatementI => {
    let statement: WhereStatementI['statement'] = ``;
    const params: any = {};

    /** generates a variable name, adds the value to the params under this name and returns it */
    const getNameAndAddToParams = (value: any) => {
        const name = `a${getUniqueNameValue()}`;
        params[name] = value;
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
                addAnd(`${nodeAlias}.${key} ${operand} ${getNameAndAddToParams(value)}`);
            } else if (isWhereIn(value)) {
                addAnd(`${nodeAlias}.${key} IN ${getNameAndAddToParams(value.in)}`);
            }
        }
    }

    return {
        statement,
        params,
    };
};
