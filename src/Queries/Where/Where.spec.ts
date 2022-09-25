/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Where, Op } from './Where';
import { trimWhitespace } from '../../utils/string';

describe('Where', () => {
  describe('contructor', () => {
    it('generates the correct statement and params', () => {
      const expectedValues = {
        equals: Math.random(),
        eq: 'eq' + Math.random(),
        in: [Math.random(), Math.random()],
        contains: 'contains' + Math.random(),
        gt: Math.random(),
        gte: Math.random(),
        lt: Math.random(),
        lte: Math.random(),
        ne: 'ne' + Math.random(),
      };

      const where = new Where({
        identifier: {
          equals: expectedValues.equals,
          eq: {
            [Op.eq]: expectedValues.eq,
          },
          in: {
            [Op.in]: expectedValues.in,
          },
          _in: {
            [Op._in]: expectedValues.in,
          },
          contains: {
            [Op.contains]: expectedValues.contains,
          },
          gt: {
            [Op.gt]: expectedValues.gt,
          },
          gte: {
            [Op.gte]: expectedValues.gte,
          },
          lt: {
            [Op.lt]: expectedValues.lt,
          },
          lte: {
            [Op.lte]: expectedValues.lte,
          },
          ne: {
            [Op.ne]: expectedValues.ne,
          },
          // @ts-expect-error
          null: [null],
        },
      });

      expect(
        where.getStatement('text').includes('identifier.equals = $equals'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.eq = $eq'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.in IN $in'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('$in IN identifier._in'),
      ).toBeTruthy();
      expect(
        where
          .getStatement('text')
          .includes('identifier.contains CONTAINS $contains'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.gt > $gt'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.gte >= $gte'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.lt < $lt'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.lte <= $lte'),
      ).toBeTruthy();
      expect(
        where.getStatement('text').includes('identifier.ne <> $ne'),
      ).toBeTruthy();

      expect(where.getBindParam().get()).toEqual(expectedValues);
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

  it('ignores null and undefined values', () => {
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
