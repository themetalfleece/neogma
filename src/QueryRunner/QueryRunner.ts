import { Session, StatementResult } from 'neo4j-driver/types/v1';
import { WhereStatementI } from './Where';

/** surrounds the label with backticks to also allow spaces */
const getLabel = (label: string) => '`' + label + '`';

/**
 * 
 * @param session - the session for running this query
 * @param nodesLabel - the label of the nodes to create
 * @param options - the data to create
 */
export const createMany = async <T>(session: Session, nodesLabel: string, options: T[]): Promise<StatementResult> => {

    const label = getLabel(nodesLabel);

    const statement = `
        UNWIND {options} as ${label}
        CREATE (node: ${label})
        SET node = ${label}
        RETURN ${label};
    `;

    return session.run(statement, { options });

};

/**
 * 
 * @param session - the session for running this query
 * @param nodesLabel - the label of the nodes to create
 * @param where - the where object for matching the nodes to be edited
 * @param options - the new data data, to be edited
 */
export const editMany = async <T>(session: Session, nodesLabel: string, where: WhereStatementI, options: Partial<T>): Promise<StatementResult> => {

    const label = getLabel(nodesLabel);

    const statement = `
        MATCH (${label}: ${label})
        WHERE ${where.statement}
        SET ${label} += { options }
        return ${label}
    `;

    return session.run(statement, { options, ...where.params });

};

/**
 * 
 * @param session - the session for running this query
 * @param nodesLabel - the label of the nodes to create
 * @param where - the where object for matching the nodes to be deleted
 */
export const deleteMany = async (session: Session, nodesLabel: string, where: WhereStatementI): Promise<StatementResult> => {

    const label = getLabel(nodesLabel);

    const statement = `
        MATCH (${label}: ${label})
        WHERE ${where.statement}
        OPTIONAL MATCH (${label})-[r]-()
        DELETE ${label},r
    `;

    return session.run(statement, { ...where.params });

};

export interface CreateRelationshipParamsI {
    a: {
        label: string;
    };
    b: {
        label: string;
    };
    relationship: {
        label: string;
        direction: 'a->b' | 'a-b' | 'a<-b',
    };
    /** can access query labels by `a` and `b` */
    where: WhereStatementI;
}

export const createRelationship = async (session: Session, params: CreateRelationshipParamsI): Promise<StatementResult> => {

    const { a, b, relationship, where } = params;

    /** string in the format -[Label]-> */
    const directionString = `${relationship.direction === 'a<-b' ? '<-' : '-'}[:${getLabel(relationship.label)}]${relationship.direction === 'a->b' ? '->' : '-'}`;

    const statement = `
        MATCH (a:${getLabel(a.label)}), (b:${getLabel(b.label)})
        WHERE ${where.statement}
        CREATE (a)${directionString}(b)
    `;

    return session.run(statement, { ...where.params });
};
