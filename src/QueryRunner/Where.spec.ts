import { Where, Op } from './Where';

describe('Where', () => {
    it('expects where in to work properly', () => {
        const inValue = [2, 3, 4];

        const where = new Where({
            identifier: {
                a: 1,
                b: [null],
                c: {
                    [Op.in]: inValue,
                },
            },
        });

        expect(where.statement.includes('identifier.c IN $c')).toBeTruthy();
        expect(where.bindParam.get().c).toEqual(inValue);
    });

    it('works as intended with null and undefined values', () => {
        const undefinedIdentifier = 'ui_' + Math.random().toString();

        const where = new Where({
            identifier: {
                a: null,
                [undefinedIdentifier]: undefined,
            },
        });

        expect(where.statement.includes('identifier.a = $a')).toBeTruthy();
        expect(where.statement.includes(undefinedIdentifier)).toBeFalsy();
    });
});
