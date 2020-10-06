import { QueryBuilder } from './QueryBuilder';

describe.only('QueryBuilder', () => {
    it('Builds a query of every parameters type', () => {
        const queryBuilder = new QueryBuilder([
            {
                match: '(u: User)',
            },
            {
                match: '(o: Order)',
            },
        ]);

        console.log(queryBuilder.getStatement());
    });
});
