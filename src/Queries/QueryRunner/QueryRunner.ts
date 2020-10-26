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
import { getRunnable } from '../../Sessions';
import { BindParam } from '../BindParam/BindParam';
import { AnyWhereI, Where } from '../Where/Where';
import { trimWhitespace } from '../../utils/string';
import { QueryBuilder } from '../QueryBuilder';

type AnyObject = Record<string, any>;

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
    private logger:
        | null
        | ((...val: Array<string | boolean | AnyObject | number>) => any);

    constructor(params: {
        driver: QueryRunner['driver'];
        logger?: QueryRunner['logger'];
    }) {
        this.driver = params.driver;
        this.logger = params?.logger || null;
    }

    private log(...val: Array<string | boolean | AnyObject | number>) {
        this.logger?.(...val);
    }

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

        const queryBuilder = new QueryBuilder([
            {
                unwind: '{options} as data',
            },
            {
                create: {
                    identifier,
                    label,
                },
            },
            {
                set: `${identifier} += data`,
            },
            {
                return: identifier,
            },
        ]);

        // we won't use the queryBuilder bindParams as we've used "options" as a literal
        const parameters = { options };

        return this.run(
            queryBuilder.getStatement(),
            parameters,
            params.session,
        );
    };

    public update = async <
        T extends Record<string, Neo4jSupportedTypes>
    >(params: {
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
        const { label } = params;

        const data = params.data as Record<string, Neo4jSupportedTypes>;

        const identifier = params.identifier || QueryRunner.identifiers.default;

        const where = Where.acquire(params.where);

        return this.buildAndRun(
            [
                {
                    match: {
                        identifier,
                        label,
                    },
                },
                where && {
                    where: where,
                },
                {
                    set: {
                        identifier,
                        properties: data,
                    },
                },
                (params.return || null) && {
                    return: identifier,
                },
            ],
            {
                /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
                bindParam: where?.getBindParam().clone(),
                existingSession: params.session,
            },
        );
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

        return this.buildAndRun(
            [
                {
                    match: {
                        identifier,
                        label,
                    },
                },
                where && {
                    where,
                },
                {
                    delete: {
                        identifiers: identifier,
                        detach,
                    },
                },
            ],
            {
                bindParam: where?.getBindParam(),
                existingSession: params.session,
            },
        );
    };

    public createRelationship = async (
        params: CreateRelationshipParamsI,
    ): Promise<QueryResult> => {
        const { source, target, relationship } = params;
        const where = Where.acquire(params.where);

        const relationshipIdentifier = 'r';

        const identifiers = {
            source:
                source.identifier ||
                QueryRunner.identifiers.createRelationship.source,
            target:
                target.identifier ||
                QueryRunner.identifiers.createRelationship.target,
        };

        return this.buildAndRun(
            [
                {
                    match: {
                        multiple: [
                            {
                                identifier: identifiers.source,
                                label: source.label,
                            },
                            {
                                identifier: identifiers.target,
                                label: target.label,
                            },
                        ],
                    },
                },
                where && {
                    where,
                },
                {
                    create: {
                        related: [
                            {
                                identifier: identifiers.source,
                            },
                            {
                                direction: relationship.direction,
                                name: relationship.name,
                                identifier: relationshipIdentifier,
                            },
                            {
                                identifier: identifiers.target,
                            },
                        ],
                    },
                },
                /** the relationship properties statement to be inserted into the final statement string */
                params.relationship.properties && {
                    set: {
                        identifier: relationshipIdentifier,
                        properties: params.relationship.properties,
                    },
                },
            ],
            {
                existingSession: params.session,
                /** the params of the relationship value */
                bindParam: where?.getBindParam()?.clone(),
            },
        );
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
                const existingSessionIdentifier = this.sessionIdentifiers.get(
                    session,
                );
                if (existingSessionIdentifier) {
                    sessionIdentifier = existingSessionIdentifier;
                } else {
                    sessionIdentifier = uuid.v4();
                    this.sessionIdentifiers.set(session, sessionIdentifier);
                }

                const trimmedStatement = trimWhitespace(statement);
                this.log(sessionIdentifier);
                this.log(`\tStatement:`, trimmedStatement);
                this.log(`\tParameters:`, parameters);
                return session.run(trimmedStatement, parameters);
            },
            this.driver,
        );
    }

    /** creates a QueryBuilder object and runs its statement */
    public buildAndRun(
        /** parameters for the query */
        parameters: ConstructorParameters<typeof QueryBuilder>[0],
        config?: {
            /** an existing bindParam to be used */
            bindParam?: BindParam;
            /** the session or transaction for running this query */
            existingSession?: Runnable | null;
        },
    ): Promise<QueryResult> {
        return getRunnable(
            config?.existingSession,
            async (session) => {
                const queryBuilder = new QueryBuilder(parameters, {
                    bindParam: config?.bindParam,
                });
                return this.run(
                    queryBuilder.getStatement(),
                    queryBuilder.getBindParam(),
                    session,
                );
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

    public static getResultProperties = <T>(
        result: QueryResult,
        identifier: string,
    ): T[] => {
        return result.records.map((v) => v.get(identifier).properties);
    };

    public static getNodesDeleted = (result: QueryResult): number => {
        return result.summary.counters.updates().nodesDeleted;
    };
}
