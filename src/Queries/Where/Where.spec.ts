/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Where, Op } from './Where';
import { trimWhitespace } from '../../utils/string';

describe('Where', () => {
    describe('contructor', () => {
        it('generates the correct statement and params', () => {
            const inValue = [2, 3, 4];

            const containsString = `c${Math.random()}`;

            const where = new Where({
                identifier: {
                    a: 1,
                    // @ts-expect-error
                    b: [null],
                    c: {
                        [Op.in]: inValue,
                    },
                    d: {
                        [Op.contains]: containsString,
                    },
                },
            });

            expect(
                where.getStatement('text').includes('identifier.c IN $c'),
            ).toBeTruthy();
            expect(
                where.getStatement('text').includes('identifier.d CONTAINS $d'),
            ).toBeTruthy();
            expect(where.getBindParam().get().d).toEqual(containsString);
            expect(where.getBindParam().get().c).toEqual(inValue);
            expect(Object.keys(where.getBindParam().get()).length).toEqual(3);
        });
    });

    describe('addParams', () => {
        it('adds non-overlapping params', () => {
            const initial = {
                a: 1,
                b: 2,
            };
            const where = new Where({
                identifier: initial,
            });

            const added = {
                c: 3,
            };
            where.addParams({
                identifier: added,
            });

            expect(trimWhitespace(where.getStatement('object'))).toEqual(
                trimWhitespace('{ a: $a, b: $b, c: $c }'),
            );
            expect(where.getBindParam().get()).toEqual({
                ...initial,
                ...added,
            });
            expect(Object.keys(where.getBindParam().get()).length).toEqual(3);
        });

        it('adds overlapping params', () => {
            const initial = {
                a: 1,
                b: 2,
            };
            const where = new Where({
                identifier: initial,
            });

            const added = {
                a: 3,
            };
            where.addParams({
                identifier: added,
            });

            expect(trimWhitespace(where.getStatement('object'))).toEqual(
                trimWhitespace('{ a: $a, b: $b }'),
            );
            expect(where.getBindParam().get()).toEqual({
                ...initial,
                ...added,
            });
            expect(Object.keys(where.getBindParam().get()).length).toEqual(2);
        });
    });

    it('works as intended with null and undefined values', () => {
        const undefinedIdentifier = 'ui_' + Math.random().toString();
        const nullIdentifier = 'ui_' + Math.random().toString();

        const where = new Where({
            // @ts-expect-error
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
