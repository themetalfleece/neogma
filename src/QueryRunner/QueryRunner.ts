import { QueryResult, Session } from 'neo4j-driver/types';
import { AnyWhere, BindParam, Where } from './Where';

export interface CreateRelationshipParamsI {
    source: {
        label: string;
    };
    target: {
        label: string;
    };
    relationship: {
        label: string;
        direction: 'out' | 'in' | 'none',
        /** values to be set as relationship attributes */
        values?: object;
    };
    /** can access query identifiers by `source` and `target` */
    where: AnyWhere;
}

export class QueryRunner {

    /** whether to log the statements and parameters with the given function */
    private logger: (...val: Array<string | boolean | object | number>) => any;

    constructor(params?: {
        logger?: QueryRunner['logger'];
    }) {
        this.logger = params?.logger || null;
    }

    /** surrounds the label with backticks to also allow spaces */
    public static getLabel = (label: string) => '`' + label + '`';

    private log(...val: Array<string | boolean | object | number>) {
        this.logger?.(...val);
    }

    /**
     * 
     * @param session - the session for running this query
     * @param nodesLabel - the label of the nodes to create
     * @param options - the data to create
     */
    public createMany = async <T>(session: Session, nodesLabel: string, options: T[]): Promise<QueryResult> => {

        const label = QueryRunner.getLabel(nodesLabel);

        const statement = `
            UNWIND {options} as ${label}
            CREATE (node: ${label})
            SET node = ${label}
            RETURN ${label};
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
     */
    public editMany = async <T>(session: Session, nodesLabel: string, options: Partial<T>, anyWhere?: AnyWhere): Promise<QueryResult> => {
        const label = QueryRunner.getLabel(nodesLabel);

        const where = Where.get(anyWhere);

        let statement = `
            MATCH (${label}: ${label})
        `;
        if (where) {
            statement += `WHERE ${where.statement}`;
        }
        statement += `
            SET ${label} += { options }
            return ${label}
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
     */
    public deleteMany = async (session: Session, nodesLabel: string, anyWhere?: AnyWhere): Promise<QueryResult> => {
        const label = QueryRunner.getLabel(nodesLabel);

        const where = Where.get(anyWhere);

        let statement = `
            MATCH (${label}: ${label})
        `;
        if (where) {
            statement += `WHERE ${where.statement}`;
        }
        statement += `
            OPTIONAL MATCH (${label})-[r]-()
            DELETE ${label},r
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
        const directionString = `${relationship.direction === 'in' ? '<-' : '-'}[r:${QueryRunner.getLabel(relationship.label)}]${relationship.direction === 'out' ? '->' : '-'}`;

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

        const statement = `
            MATCH (source:${QueryRunner.getLabel(source.label)}), (target:${QueryRunner.getLabel(target.label)})
            WHERE ${whereInstance.statement}
            CREATE (source)${directionString}(target)
            ${relationshipValuesStatement}
        `;

        const parameters = relationshipAttributesParams.get();

        this.log(statement, parameters);

        return session.run(statement, parameters);
    }

}
