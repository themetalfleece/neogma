import { Session, StatementResult } from 'neo4j-driver/types/v1';

const equalsOrIn = (param: string | string[]) => {
    return param instanceof Array ? 'IN' : '=';
};

/** surrounds the label with backticks to also allow spaces */
const getLabel = (label: string) => '`' + label + '`';

export const createMany = async <T>(session: Session, _label: string, options: T[]): Promise<StatementResult> => {

    const label = getLabel(_label);

    const statement = `
        UNWIND {options} as ${label}
        CREATE (node: ${label})
        SET node = ${label}
        RETURN ${label};
    `;

    return session.run(statement, { options });

};

export const editMany = async <T>(session: Session, _label: string, _ids: string[], options: Partial<T>): Promise<StatementResult> => {

    const label = getLabel(_label);

    const statement = `
        MATCH (${label}: ${label})
        WHERE ${label}._id IN { _ids }
        SET ${label} += { options }
        return ${label}
    `;

    return session.run(statement, { options, _ids });

};

export const deleteMany = async (session: Session, _label: string, _ids: string[]): Promise<StatementResult> => {

    const label = getLabel(_label);

    const statement = `
        MATCH (${label}: ${label})
        WHERE ${label}._id IN { _ids }
        OPTIONAL MATCH (${label})-[r]-()
        DELETE ${label},r
    `;

    return session.run(statement, { _ids });

};

export interface CreateRelationshipParamsI {
    a: {
        label: string;
        _id: string | string[];
    };
    b: {
        label: string;
        _id: string | string[];
    };
    relationship: {
        label: string;
        direction: 'a->b' | 'a-b' | 'a<-b',
    };
}

export const createRelationship = async (session: Session, params: CreateRelationshipParamsI): Promise<StatementResult> => {

    const { a, b, relationship } = params;

    const statement = `
        MATCH (a:${getLabel(a.label)}), (b:${getLabel(b.label)})
        WHERE a._id ${equalsOrIn(a._id)} {a_id} and b._id ${equalsOrIn(b._id)} {b_id}
        CREATE (a)${relationship.direction === 'a<-b' ? '<-' : '-'}[:${getLabel(relationship.label)}]${relationship.direction === 'a->b' ? '->' : '-'}(b)
    `;

    return session.run(statement,
        {
            a_id: a._id,
            b_id: b._id,
        }
    );
};
