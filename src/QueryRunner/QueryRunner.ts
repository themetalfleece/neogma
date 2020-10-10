import {
    Driver,
    QueryResult,
    Session,
    Transaction,
    DateTime as Neo4jDateTime,
    Date as Neo4jDate,
    Point as Neo4jPoint,
    Time as Neo4jTime,
    Integer as Neo4jInteger,
    LocalDateTime as Neo4jLocalDateTime,
    LocalTime as Neo4jLocalTime,
    Duration as Neo4jDuration,
} from 'neo4j-driver/types';
import * as uuid from 'uuid';
import { getRunnable } from '../Sessions';
import { BindParam } from './BindParam';
import { AnyWhereI, Where } from './Where';
import { replaceWhitespace } from '../utils/string';

type AnyObject = Record<string, any>;

export const getResultProperties = <T>(
    result: QueryResult,
    identifier: string,
): T[] => {
    return result.records.map((v) => v.get(identifier).properties);
};

export const getNodesDeleted = (result: QueryResult): number => {
    return result.summary.counters.updates().nodesDeleted;
};

/** the single types that Neo4j supports (not including an array of them) */
export type Neo4jSingleTypes =
    | number
    | Neo4jInteger
    | string
    | boolean
    | Neo4jPoint
    | Neo4jDate
    | Neo4jTime
    | Neo4jLocalTime
    | Neo4jDateTime
    | Neo4jLocalDateTime
    | Neo4jDuration;
/** all the types that Neo4j supports (single or array) */
export type Neo4jSupportedTypes = Neo4jSingleTypes | Neo4jSingleTypes[];

/** can run queries, is either a Session or a Transaction */
export type Runnable = Session | Transaction;

export interface CreateRelationshipParamsI {
    source: {
        label?: string;
        /** identifier to be used in the query. Defaults to the value of QueryRunner.identifiers.createRelationship.source */
        identifier?: string;
    };
    target: {
        label?: string;
        /** identifier to be used in the query. Defaults to the value of QueryRunner.identifiers.createRelationship.target */
        identifier?: string;
    };
    relationship: {
        name: string;
        direction: 'out' | 'in' | 'none';
        /** properties to be set as relationship attributes */
        properties?: AnyObject;
    };
    /** can access query identifiers by setting the "identifier" property of source/target, else by the values of QueryRunner.identifiers.createRelationship */
    where?: AnyWhereI;
    /** the session or transaction for running this query */
    session?: Runnable | null;
}

export class QueryRunner {
    private driver: Driver;
    /** whether to log the statements and parameters with the given function */
    private logger: (
        ...val: Array<string | boolean | AnyObject | number>
    ) => any;

    constructor(params?: {
        driver: QueryRunner['driver'];
        logger?: QueryRunner['logger'];
    }) {
        this.driver = params.driver;
        this.logger = params?.logger || null;
    }

    private log(...val: Array<string | boolean | AnyObject | number>) {
        this.logger?.(...val);
    }

    /**
     * surrounds the label with backticks to also allow spaces
     * @param label - the label to use
     * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
     */
    public static getNormalizedLabels = (
        label: string | string[],
        operation?: 'and' | 'or',
    ): string => {
        const labels = label instanceof Array ? label : [label];
        return labels
            .map((l) => '`' + l + '`')
            .join(operation === 'or' ? '|' : ':');
    };

    /**
     * returns a string to be used in a query, regardless if any of the identifier or label are null
     */
    public static getIdentifierWithLabel = (
        identifier?: string,
        label?: string,
    ): string => {
        return `${identifier ? identifier : ''}${label ? ':' + label : ''}`;
    };

    /**
     * returns the appropriate string for a node, ready to be put in a statement
     * example: (ident: Label { a.p1: $v1 })
     */
    public static getNodeStatement = ({
        identifier,
        label,
        inner,
    }: {
        /** identifier for the node */
        identifier?: string;
        /** identifier for the label */
        label?: string;
        /** a statement to be used inside the node, like a where condition or properties */
        inner?:
            | string
            | Where
            | {
                  properties: Record<string, Neo4jSupportedTypes>;
                  bindParam: BindParam;
              };
    }): string => {
        const nodeParts: string[] = [];

        nodeParts.push(QueryRunner.getIdentifierWithLabel(identifier, label));

        if (inner) {
            if (typeof inner === 'string') {
                nodeParts.push(inner);
            } else if (inner instanceof Where) {
                nodeParts.push(inner.getStatement('object'));
            } else {
                nodeParts.push(
                    QueryRunner.getPropertiesWithParams(
                        inner.properties,
                        inner.bindParam,
                    ),
                );
            }
        }

        return `(${nodeParts.join(' ')})`;
    };

    /**
     * returns the appropriate string for a relationship, ready to be put in a statement
     * example: -[identifier: name {where}]->
     */
    public static getRelationshipStatement = (params: {
        /** relationship direction */
        direction: CreateRelationshipParamsI['relationship']['direction'];
        /** relationship name */
        name: string;
        /** relationship identifier. If empty, no identifier will be used */
        identifier?: string;
        /** a statement to be used inside the relationship, like a where condition or properties */
        inner?:
            | string
            | Where
            | {
                  properties: Record<string, Neo4jSupportedTypes>;
                  bindParam: BindParam;
              };
    }): string => {
        const { direction, name, inner } = params;
        const identifier = params.identifier || '';

        const allParts: string[] = [];

        // <- or -
        allParts.push(direction === 'in' ? '<-' : '-');

        // strings will be inside [ ]
        const innerRelationshipParts: string[] = [];
        // identifier:Name
        innerRelationshipParts.push(
            QueryRunner.getIdentifierWithLabel(identifier, name),
        );
        if (inner) {
            if (typeof inner === 'string') {
                innerRelationshipParts.push(inner);
            } else if (inner instanceof Where) {
                innerRelationshipParts.push(inner.getStatement('object'));
            } else {
                innerRelationshipParts.push(
                    QueryRunner.getPropertiesWithParams(
                        inner.properties,
                        inner.bindParam,
                    ),
                );
            }
        }

        // FIXME handle properties

        // wrap it in [ ]
        allParts.push(`[${innerRelationshipParts.join(' ')}]`);

        // -> or -
        allParts.push(direction === 'out' ? '->' : '-');

        return allParts.join('');
    };

    public create = async <T>(params: {
        /** the label of the nodes to create */
        label: string;
        /** the data to create */
        data: T[];
        /** identifier for the nodes */
        identifier?: string;
        /** the session or transaction for running this query */
        session?: Runnable | null;
    }): Promise<QueryResult> => {
        const { label, data: options } = params;
        const identifier = params.identifier || QueryRunner.identifiers.default;

        const { getNodeStatement: getNodeData } = QueryRunner;
        const statement = `
            UNWIND {options} as data
            CREATE ${getNodeData({ identifier, label })}
            SET ${identifier} += data
            RETURN ${identifier};
        `;

        const parameters = { options };

        return this.run(statement, parameters, params.session);
    };

    public update = async <T>(params: {
        /** the label of the nodes to create */
        label?: string;
        /** the where object for matching the nodes to be edited */
        data: Partial<T>;
        /** the new data data, to be edited */
        where?: AnyWhereI;
        /** identifier for the nodes */
        identifier?: string;
        /** whether to return the nodes */
        return?: boolean;
        /** the session or transaction for running this query */
        session?: Runnable | null;
    }): Promise<QueryResult> => {
        const { label, data } = params;

        const identifier = params.identifier || QueryRunner.identifiers.default;

        const where = Where.acquire(params.where);

        /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
        const updateBindParam = where.getBindParam().clone();

        const statementParts: string[] = [];
        statementParts.push(
            `MATCH ${QueryRunner.getNodeStatement({ identifier, label })}`,
        );
        if (where) {
            statementParts.push(`WHERE ${where.getStatement('text')}`);
        }

        const { statement: setStatement } = QueryRunner.getSetParts({
            data,
            bindParam: updateBindParam,
            identifier,
        });
        statementParts.push(setStatement);

        if (params.return) {
            statementParts.push(`
                RETURN ${identifier}
            `);
        }

        const statement = statementParts.join(' ');
        const parameters = updateBindParam.get();

        return this.run(statement, parameters, params.session);
    };

    public delete = async (params: {
        label?: string;
        where?: AnyWhereI;
        identifier?: string;
        /** detach relationships */
        detach?: boolean;
        /** the session or transaction for running this query */
        session?: Runnable | null;
    }): Promise<QueryResult> => {
        const { label, detach } = params;
        const where = Where.acquire(params.where);

        const identifier = params.identifier || QueryRunner.identifiers.default;

        const statementParts: string[] = [];
        statementParts.push(
            `MATCH ${QueryRunner.getNodeStatement({ identifier, label })}`,
        );
        if (where) {
            statementParts.push(`WHERE ${where.getStatement('text')}`);
        }
        if (detach) {
            statementParts.push('DETACH');
        }
        statementParts.push(`DELETE ${identifier}`);

        const statement = statementParts.join(' ');
        const parameters = { ...where?.getBindParam().get() };

        return this.run(statement, parameters, params.session);
    };

    public createRelationship = async (
        params: CreateRelationshipParamsI,
    ): Promise<QueryResult> => {
        const { source, target, relationship, where } = params;
        const whereInstance = Where.acquire(where);

        const relationshipIdentifier = 'r';

        /** the params of the relationship value */
        const relationshipAttributesParams = BindParam.acquire(
            whereInstance?.getBindParam(),
        ).clone();
        /** the properties to be converted to a string, to be put into the statement. They refer relationshipAttributesParams by their key name */
        const relationshipProperties: string[] = [];
        if (relationship.properties) {
            for (const key in relationship.properties) {
                if (!relationship.properties.hasOwnProperty(key)) {
                    continue;
                }

                const paramName = relationshipAttributesParams.getUniqueNameAndAdd(
                    key,
                    relationship.properties[key],
                );
                relationshipProperties.push(
                    `${relationshipIdentifier}.${key} = $${paramName}`,
                );
            }
        }

        const identifiers = {
            source:
                source.identifier ||
                QueryRunner.identifiers.createRelationship.source,
            target:
                target.identifier ||
                QueryRunner.identifiers.createRelationship.target,
        };
        const { getNodeStatement: getNodeData } = QueryRunner;
        const statementParts: string[] = [];
        statementParts.push('MATCH');
        statementParts.push(
            [
                getNodeData({
                    identifier: identifiers.source,
                    label: source.label,
                }),
                getNodeData({
                    identifier: identifiers.target,
                    label: target.label,
                }),
            ].join(', '),
        );
        if (whereInstance) {
            statementParts.push(`WHERE ${whereInstance.getStatement('text')}`);
        }

        statementParts.push('CREATE');
        // (source)
        statementParts.push(getNodeData({ identifier: identifiers.source }));
        // -[relationship]-
        statementParts.push(
            QueryRunner.getRelationshipStatement({
                direction: relationship.direction,
                name: relationship.name,
                identifier: relationshipIdentifier,
            }),
        );
        // (target)
        statementParts.push(getNodeData({ identifier: identifiers.target }));

        /** the relationship properties statement to be inserted into the final statement string */
        if (relationshipProperties.length) {
            statementParts.push('SET ' + relationshipProperties.join(', '));
        }

        const statement = statementParts.join(' ');
        const parameters = relationshipAttributesParams.get();

        return this.run(statement, parameters, params.session);
    };

    /** returns the parts and the statement for a SET operation with the given params */
    public static getSetParts = (params: {
        /** data to set */
        data: AnyObject;
        /** bind param to use */
        bindParam: BindParam;
        /** identifier to use */
        identifier: string;
    }): {
        parts: string[];
        statement: string;
    } => {
        const { data, bindParam, identifier } = params;

        const setParts: string[] = [];
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            const paramKey = bindParam.getUniqueNameAndAdd(key, data[key]);
            setParts.push(`${identifier}.${key} = $${paramKey}`);
        }

        return {
            parts: setParts,
            statement: `SET ${setParts.join(', ')}`,
        };
    };

    /**
     * returns an object with replacing its values with a bind param value
     * example return value: ( a.p1 = $v1, b.p2 = $v2 )
     */
    public static getPropertiesWithParams = (
        /** data to set */
        data: AnyObject,
        /** bind param to use and mutate */
        bindParam: BindParam,
    ): string => {
        const parts: string[] = [];

        for (const key of Object.keys(data)) {
            parts.push(
                `${key}: $${bindParam.getUniqueNameAndAdd(key, data[key])}`,
            );
        }

        return `{${parts.join(',')}}`;
    };

    /** maps a session object to a uuid, for logging purposes */
    private sessionIdentifiers = new WeakMap<Runnable, string>([]);

    /** runs a statement */
    public run(
        /** the statement to run */
        statement: string,
        /** parameters for the query */
        parameters?: Record<string, any>,
        /** the session or transaction for running this query */
        existingSession?: Runnable | null,
    ): Promise<QueryResult> {
        return getRunnable(
            existingSession,
            async (session) => {
                parameters = parameters || {};
                /** an identifier to be used for logging purposes */
                let sessionIdentifier = 'Default';
                if (this.sessionIdentifiers.has(session)) {
                    sessionIdentifier = this.sessionIdentifiers.get(session);
                } else {
                    sessionIdentifier = uuid.v4();
                    this.sessionIdentifiers.set(session, sessionIdentifier);
                }

                const trimmedStatement = replaceWhitespace(statement);
                this.log(sessionIdentifier);
                this.log(`\tStatement:`, trimmedStatement);
                this.log(`\tParameters:`, parameters);
                return session.run(trimmedStatement, parameters);
            },
            this.driver,
        );
    }

    /** default identifiers for the queries */
    public static readonly identifiers = {
        /** general purpose default identifier */
        default: 'nodes',
        /** default identifiers for createRelationship */
        createRelationship: {
            /** default identifier for the source node */
            source: 'source',
            /** default identifier for the target node */
            target: 'target',
        },
    };
}
