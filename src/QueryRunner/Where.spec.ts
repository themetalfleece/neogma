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

        expect(
            where.getStatement('text').includes('identifier.c IN $c'),
        ).toBeTruthy();
        expect(where.getBindParam().get().c).toEqual(inValue);
    });

    it('works as intended with null and undefined values', () => {
        const undefinedIdentifier = 'ui_' + Math.random().toString();
        const nullIdentifier = 'ui_' + Math.random().toString();

        const where = new Where({
            identifier: {
                a: 1,
                [nullIdentifier]: null,
                [undefinedIdentifier]: undefined,
            },
        });

        expect(
            where.getStatement('text').includes('identifier.a = $a'),
        ).toBeTruthy();
        expect(
            where.getStatement('text').includes(undefinedIdentifier),
        ).toBeFalsy();
        expect(where.getStatement('text').includes(nullIdentifier)).toBeFalsy();
    });
});
