import { QueryResult, Session } from 'neo4j-driver/types';
import * as uuid from 'uuid';
import { BindParam } from './BindParam';
import { AnyWhereI, Where } from './Where';

/** the types that Neo4j supports (not including an array of them) */
export type Neo4jSingleTypes = string | number | boolean | Date;
/** the types that Neo4j supports (including an array of them) */
export type Neo4jSupportedTypes = Neo4jSingleTypes | (Neo4jSingleTypes)[];

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
        direction: 'out' | 'in' | 'none',
        /** values to be set as relationship attributes */
        values?: object;
    };
    /** can access query identifiers by setting the "identifier" property of source/target, else by the values of QueryRunnder.identifiers.createRelationship */
    where?: AnyWhereI;
}

export class QueryRunner {

    /** whether to log the statements and parameters with the given function */
    private logger: (...val: Array<string | boolean | object | number>) => any;

    constructor(params?: {
        logger?: QueryRunner['logger'];
    }) {
        this.logger = params?.logger || null;
    }

    private log(...val: Array<string | boolean | object | number>) {
        this.logger?.(...val);
    }

    /** 
     * surrounds the label with backticks to also allow spaces
     * @param label - the label to use
     * @param operation - defaults to 'and'. Whether to generate a "and" or an "or" operation for the labels
     */
    public static getNormalizedLabels = (label: string | string[], operation?: 'and' | 'or') => {
        const labels = label instanceof Array ? label : [label];
        return labels.map((l) => '`' + l + '`').join(operation === 'or' ? '|' : ':');
    }

    /**
     * returns a string to be used in a query, regardless if any of the identifier or label are null
     */
    public static getIdentifierWithLabel = (identifier?: string, label?: string) => {
        return `${identifier ? identifier : ''}${label ? ':' + label : ''}`;
    }

    public create = async <T>(
        /** the session for running this query */
        session: Session,
        params: {
            /** the label of the nodes to create */
            label: string,
            /** the data to create */
            data: T[],
            /** identifier for the nodes */
            identifier?: string
        }
    ): Promise<QueryResult> => {
        const { label, data: options } = params;
        const identifier = params.identifier || QueryRunner.identifiers.default;

        const { getIdentifierWithLabel } = QueryRunner;
        const statement = `
            UNWIND {options} as data
            CREATE (${getIdentifierWithLabel(identifier, label)})
            SET ${identifier} += data
            RETURN ${identifier};
        `;

        const parameters = { options };

        return this.run(session, statement, parameters);
    }

    public update = async <T>(
        /** the session for running this query */
        session: Session,
        params: {
            /** the label of the nodes to create */
            label?: string,
            /** the where object for matching the nodes to be edited */
            data: Partial<T>,
            /** the new data data, to be edited */
            where?: AnyWhereI,
            /** identifier for the nodes */
            identifier?: string;
            /** whether to return the nodes */
            return?: boolean;
        }
    ): Promise<QueryResult> => {
        const { label, data } = params;

        const identifier = params.identifier || QueryRunner.identifiers.default;

        const where = Where.acquire(params.where);

        /* clone the where bind param and construct one for the update, as there might be common keys between where and data */
        const updateBindParam = where.bindParam.clone();

        const statementParts: string[] = [];
        statementParts.push(`MATCH (${QueryRunner.getIdentifierWithLabel(identifier, label)})`);
        if (where) {
            statementParts.push(`WHERE ${where.statement}`);
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

        return this.run(session, statement, parameters);
    }

    public delete = async (
        session: Session,
        params: {
            label?: string;
            where?: AnyWhereI;
            identifier?: string;
            /** detach relationships */
            detach?: boolean;
        }
    ): Promise<QueryResult> => {
        const { label, detach } = params;
        const where = Where.acquire(params.where);

        const identifier = params.identifier || QueryRunner.identifiers.default;

        const statementParts: string[] = [];
        statementParts.push(`MATCH (${QueryRunner.getIdentifierWithLabel(identifier, label)})`);
        if (where) {
            statementParts.push(`WHERE ${where.statement}`);
        }
        statementParts.push(`
            ${detach ? 'DETACH ' : ''}DELETE ${identifier}
        `);

        const statement = statementParts.join(' ');
        const parameters = { ...where?.bindParam.get() };

        return this.run(session, statement, parameters);
    }

    public createRelationship = async (session: Session, params: CreateRelationshipParamsI): Promise<QueryResult> => {

        const { source, target, relationship, where } = params;
        const whereInstance = Where.acquire(where);

        const relationshipIdentifier = 'r';
        const directionAndNameString = QueryRunner.getRelationshipDirectionAndName({
            direction: relationship.direction,
            name: relationship.name,
            identifier: relationshipIdentifier,
        });

        /** the params of the relationship value */
        const relationshipAttributesParams = BindParam.acquire(whereInstance?.bindParam).clone();
        /** the values to be converted to a string, to be put into the statement. They refer relationshipAttributesParams by their key name */
        const relationshipValues: string[] = [];
        if (relationship.values) {
            for (const key in relationship.values) {
                if (!relationship.values.hasOwnProperty(key)) { continue; }

                const paramName = relationshipAttributesParams.getUniqueNameAndAdd(key, relationship.values[key]);
                relationshipValues.push(`${relationshipIdentifier}.${key} = $${paramName}`);
            }
        }

        /** the relationship values statement to be inserted into the final statement string */
        const relationshipValuesStatement = relationshipValues.length ? 'SET ' + relationshipValues.join(', ') : '';

        const identifiers = {
            source: source.identifier || QueryRunner.identifiers.createRelationship.source,
            target: target.identifier || QueryRunner.identifiers.createRelationship.target,
        };
        const { getIdentifierWithLabel } = QueryRunner;
        const statementParts: string[] = [];
        statementParts.push(`
            MATCH 
                (${getIdentifierWithLabel(identifiers.source, source.label)}), 
                (${getIdentifierWithLabel(identifiers.target, target.label)})
        `);
        if (whereInstance) {
            statementParts.push(`WHERE ${whereInstance.statement}`);
        }
        statementParts.push(`CREATE
            (${identifiers.source})${directionAndNameString}(${identifiers.target})
            ${relationshipValuesStatement}
        `);

        const statement = statementParts.join(' ');
        const parameters = relationshipAttributesParams.get();

        return this.run(session, statement, parameters);
    }

    /** returns the parts and the statement for a SET operation with the given params  */
    public static getSetParts = (params: {
        /** data to set */
        data: object;
        /** bind param to use */
        bindParam: BindParam;
        /** identifier to use */
        identifier: string
    }) => {
        const { data, bindParam, identifier } = params;

        const setParts: string[] = [];
        for (const key in data) {
            if (!data.hasOwnProperty(key)) { continue; }
            const paramKey = bindParam.getUniqueNameAndAdd(key, data[key]);
            setParts.push(`${identifier}.${key} = $${paramKey}`);
        }

        return {
            parts: setParts,
            statement: `SET ${setParts.join(', ')}`,
        };
    }

    /** 
     * returns a string in the format -[r:name]->
     */
    public static getRelationshipDirectionAndName = (params: {
        /** relationship direction */
        direction: CreateRelationshipParamsI['relationship']['direction'];
        /** relationship name */
        name: string;
        /** relationship identifier. If empty, no identifier will be used */
        identifier?: string;
    }) => {
        const { direction, name } = params;
        const identifier = params.identifier || '';
        return `${direction === 'in' ? '<-' : '-'}[${QueryRunner.getIdentifierWithLabel(identifier, name)}]${direction === 'out' ? '->' : '-'}`;
    }

    /** maps a session object to a uuid, for logging purposes */
    private sessionIdentifiers = new WeakMap<Session, string>([]);

    /** runs the statement */
    public run(session: Session, statement: string, parameters: Record<string, any>) {
        /** an identifier to be used for logging purposes */
        let sessionIdentifier = 'Default';
        if (this.sessionIdentifiers.has(session)) {
            sessionIdentifier = this.sessionIdentifiers.get(session);
        } else {
            sessionIdentifier = uuid.v4();
            this.sessionIdentifiers.set(session, sessionIdentifier);
        }

        const trimmedStatement = statement.replace(/\s+/g, ' ');
        this.log(sessionIdentifier);
        this.log(`\tStatement:`, trimmedStatement);
        this.log(`\tParameters:`, parameters);

        return session.run(trimmedStatement, parameters);
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
