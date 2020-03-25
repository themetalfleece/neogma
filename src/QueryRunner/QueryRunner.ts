import { QueryResult, Session } from 'neo4j-driver/types';
import { AnyWhereI, BindParam, Where } from './Where';

export interface CreateRelationshipParamsI {
    source: {
        label: string;
        /** identifier to be used in the query. defaults to the value of QueryRunner.identifiers.createRelationship.source */
        identifier?: string;
    };
    target: {
        label: string;
        /** identifier to be used in the query. defaults to the value of QueryRunner.identifiers.createRelationship.target */
        identifier?: string;
    };
    relationship: {
        label: string;
        direction: 'out' | 'in' | 'none',
        /** values to be set as relationship attributes */
        values?: object;
    };
    /** can access query identifiers by setting the "identifiers" property, else by the values of QueryRunnder.identifiers.createRelationship */
    where: AnyWhereI;
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

    /** surrounds the label with backticks to also allow spaces */
    public static getNormalizedLabels = (label: string | string[]) => {
        const labels = label instanceof Array ? label : [label];
        return labels.map((l) => '`' + l + '`').join(':');
    }

    /**
     * 
     * @param session - the session for running this query
     * @param nodesLabel - the label of the nodes to create
     * @param options - the data to create
     * @param identifier - identifier for the nodes
     */
    public createMany = async <T>(session: Session, label: string, options: T[], identifier?: string): Promise<QueryResult> => {

        identifier = identifier || 'nodes';

        const statement = `
            UNWIND {options} as data
            CREATE (${identifier}:${label})
            SET ${identifier} += data
            RETURN ${identifier};
        `;

        const parameters = { options };

        this.log(statement, parameters);

        return session.run(statement, parameters);

    }

    /**
     * 
     * @param session - the session for running this query
     * @param nodesLabel - the label of the nodes to create
     * @param where - the where object for matching the nodes to be edited
     * @param options - the new data data, to be edited
     * @param identifier - identifier for the nodes
     */
    public editMany = async <T>(session: Session, label: string, options: Partial<T>, anyWhere?: AnyWhereI, identifier?: string): Promise<QueryResult> => {
        const where = Where.get(anyWhere);

        identifier = identifier || 'nodes';

        let statement = `
            MATCH (${identifier}:${label})
        `;
        if (where) {
            statement += `WHERE ${where.statement}`;
        }
        statement += `
            SET ${identifier} += { options }
            return ${identifier}
        `;

        const parameters = {
            ...BindParam.acquire(where?.bindParam).clone().add(options).get(),
        };

        this.log(statement, parameters);

        return session.run(statement, parameters);

    }

    /**
     * 
     * @param session - the session for running this query
     * @param nodesLabel - the label of the nodes to create
     * @param where - the where object for matching the nodes to be deleted
     * @param identifier - identifier for the nodes
     */
    public deleteMany = async (session: Session, label: string, anyWhere?: AnyWhereI, identifier?: string): Promise<QueryResult> => {
        const where = Where.get(anyWhere);

        identifier = identifier || 'nodes';

        let statement = `
            MATCH (${identifier}: ${label})
        `;
        if (where) {
            statement += `WHERE ${where.statement}`;
        }
        statement += `
            OPTIONAL MATCH (${identifier})-[r]-()
            DELETE ${identifier},r
        `;

        const parameters = { ...where?.bindParam.get() };

        this.log(statement, parameters);

        return session.run(statement, parameters);

    }

    public createRelationship = async (session: Session, params: CreateRelationshipParamsI): Promise<QueryResult> => {

        const { source, target, relationship, where } = params;
        const whereInstance = Where.get(where);

        /** 
         * string in the format -[Label]->
         * relationship has the alias `r`
         */
        const directionString = `${relationship.direction === 'in' ? '<-' : '-'}[r:${relationship.label}]${relationship.direction === 'out' ? '->' : '-'}`;

        /** the params of the relationship value */
        const relationshipAttributesParams = BindParam.acquire(whereInstance.bindParam).clone();
        /** the values to be converted to a string, to be put into the statement. They refer relationshipAttributesParams by their key name */
        const relationshipValues: string[] = [];
        if (relationship.values) {
            for (const key in relationship.values) {
                if (!relationship.values.hasOwnProperty(key)) { continue; }

                const paramName = relationshipAttributesParams.getUniqueNameAndAdd(key, relationship.values[key]);
                relationshipValues.push(`r.${key} = {${paramName}}`);
            }
        }

        /** the relationship values statement to be inserted into the final statement string */
        const relationshipValuesStatement = relationshipValues.length ? 'SET ' + relationshipValues.join(', ') : '';

        const identifiers = {
            source: source.identifier || QueryRunner.identifiers.createRelationship.source,
            target: target.identifier || QueryRunner.identifiers.createRelationship.target,
        };
        const statement = `
            MATCH (${identifiers.source}:${source.label}), (${identifiers.target}:${target.label})
            WHERE ${whereInstance.statement}
            CREATE (${identifiers.source})${directionString}(${identifiers.target})
            ${relationshipValuesStatement}
        `;

        const parameters = relationshipAttributesParams.get();

        this.log(statement, parameters);

        return session.run(statement, parameters);
    }

    /** default identifiers for the queries */
    public static readonly identifiers = {
        /** default identifiers for createRelationship */
        createRelationship: {
            /** default identifier for the source node */
            source: 'source',
            /** default identifier for the target node */
            target: 'target',
        },
    };

}
