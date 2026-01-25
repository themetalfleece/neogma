/* eslint-disable @typescript-eslint/ban-ts-comment */
import { trimWhitespace } from '../utils/string';
import { Op, Where } from '.';

describe('Where', () => {
  describe('contructor', () => {
    it('generates the correct statement and params', () => {
      const expectedValues = {
        equals: Math.random(),
        eq: 'eq' + Math.random(),
        in: [Math.random(), Math.random()],
        _in: Math.random(),
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
            [Op._in]: expectedValues._in,
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
        where.getStatement('text').includes('$_in IN identifier._in'),
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

    it('Support more than one operator per property', () => {
      const where = new Where({
        identifier: {
          property: {
            [Op.gte]: '2021-01-01',
            [Op.lte]: '2023-01-01',
          },
          primaryProperty: {
            [Op.eq]: 'someId',
          },
        },
      });
      const whereString = where.getStatement('text');
      expect(
        whereString.includes(
          'identifier.property >= $property AND identifier.property <= $property__aaaa',
        ),
      ).toBeTruthy();

      expect(
        whereString.includes('identifier.primaryProperty = $primaryProperty'),
      ).toBeTruthy();

      try {
        where.getStatement('object');
      } catch (error) {
        expect(error.message).toEqual(
          'The only operator which is supported for object mode is "eq"',
        );
      }
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

  describe('type safety', () => {
    describe('Op operator types', () => {
      it('accepts valid Op.eq with string', () => {
        const where = new Where({
          node: { name: { [Op.eq]: 'test' } },
        });
        expect(where.getStatement('text')).toContain('node.name = $name');
      });

      it('accepts valid Op.eq with number', () => {
        const where = new Where({
          node: { age: { [Op.eq]: 25 } },
        });
        expect(where.getStatement('text')).toContain('node.age = $age');
      });

      it('accepts valid Op.in with array', () => {
        const where = new Where({
          node: { status: { [Op.in]: ['active', 'pending'] } },
        });
        expect(where.getStatement('text')).toContain('node.status IN $status');
      });

      it('accepts valid Op.gt with number', () => {
        const where = new Where({
          node: { count: { [Op.gt]: 10 } },
        });
        expect(where.getStatement('text')).toContain('node.count > $count');
      });

      it('accepts valid Op.gte with number', () => {
        const where = new Where({
          node: { count: { [Op.gte]: 10 } },
        });
        expect(where.getStatement('text')).toContain('node.count >= $count');
      });

      it('accepts valid Op.lt with number', () => {
        const where = new Where({
          node: { count: { [Op.lt]: 100 } },
        });
        expect(where.getStatement('text')).toContain('node.count < $count');
      });

      it('accepts valid Op.lte with number', () => {
        const where = new Where({
          node: { count: { [Op.lte]: 100 } },
        });
        expect(where.getStatement('text')).toContain('node.count <= $count');
      });

      it('accepts valid Op.ne with string', () => {
        const where = new Where({
          node: { status: { [Op.ne]: 'deleted' } },
        });
        expect(where.getStatement('text')).toContain('node.status <> $status');
      });

      it('accepts valid Op.contains with string', () => {
        const where = new Where({
          node: { name: { [Op.contains]: 'test' } },
        });
        expect(where.getStatement('text')).toContain(
          'node.name CONTAINS $name',
        );
      });

      it('accepts valid Op._in for reverse in operator', () => {
        const where = new Where({
          node: { tag: { [Op._in]: 'important' } },
        });
        expect(where.getStatement('text')).toContain('$tag IN node.tag');
      });
    });

    describe('getStatement mode types', () => {
      it('accepts text mode', () => {
        const where = new Where({ node: { a: 1 } });
        const result = where.getStatement('text');
        expect(typeof result).toBe('string');
      });

      it('accepts object mode', () => {
        const where = new Where({ node: { a: 1 } });
        const result = where.getStatement('object');
        expect(typeof result).toBe('string');
      });

      it('rejects invalid mode', () => {
        const where = new Where({ node: { a: 1 } });
        // Type check only - not executed at runtime
        const _typeCheck = () => {
          // @ts-expect-error - mode must be 'text' or 'object'
          where.getStatement('invalid');
        };
        expect(_typeCheck).toBeDefined();
      });
    });

    describe('constructor parameter types', () => {
      it('accepts valid WhereParamsByIdentifierI', () => {
        const where = new Where({
          node1: { prop1: 'value1' },
          node2: { prop2: 123 },
        });
        expect(where.getStatement('text')).toContain('node1.prop1');
        expect(where.getStatement('text')).toContain('node2.prop2');
      });

      it('accepts multiple properties per identifier', () => {
        const where = new Where({
          node: {
            name: 'test',
            age: 25,
            active: true,
          },
        });
        const statement = where.getStatement('text');
        expect(statement).toContain('node.name');
        expect(statement).toContain('node.age');
        expect(statement).toContain('node.active');
      });
    });

    describe('static method types', () => {
      it('acquire returns Where instance when given object', () => {
        const result = Where.acquire({ node: { a: 1 } });
        expect(result).toBeInstanceOf(Where);
      });

      it('acquire returns same instance when given Where', () => {
        const where = new Where({ node: { a: 1 } });
        const result = Where.acquire(where);
        expect(result).toBe(where);
      });

      it('acquire returns null when given null', () => {
        const result = Where.acquire(null);
        expect(result).toBeNull();
      });

      it('acquire returns null when given undefined', () => {
        const result = Where.acquire(undefined);
        expect(result).toBeNull();
      });

      it('ensureIn wraps array in Op.in', () => {
        const result = Where.ensureIn([1, 2, 3]);
        expect(typeof result).toBe('object');
        expect(Op.in in (result as object)).toBe(true);
      });

      it('ensureIn returns non-array as-is', () => {
        const result = Where.ensureIn('test');
        expect(result).toBe('test');
      });
    });

    describe('addParams types', () => {
      it('addParams accepts valid WhereParamsByIdentifierI', () => {
        const where = new Where({ node: { a: 1 } });
        where.addParams({ node: { b: 2 } });
        const statement = where.getStatement('text');
        expect(statement).toContain('node.a');
        expect(statement).toContain('node.b');
      });

      it('addParams returns Where for chaining', () => {
        const where = new Where({ node: { a: 1 } });
        const result = where.addParams({ node: { b: 2 } });
        expect(result).toBe(where);
      });
    });
  });

  describe('splitByOperator', () => {
    it('puts direct values in eqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: 'John',
        age: 25,
        active: true,
      });

      expect(eqParams).toEqual({ name: 'John', age: 25, active: true });
      expect(nonEqParams).toEqual({});
    });

    it('puts Op.eq values in eqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: { [Op.eq]: 'John' },
      });

      expect(eqParams).toEqual({ name: { [Op.eq]: 'John' } });
      expect(nonEqParams).toEqual({});
    });

    it('puts Op.gt in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        age: { [Op.gt]: 18 },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ age: { [Op.gt]: 18 } });
    });

    it('puts Op.gte in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        age: { [Op.gte]: 18 },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ age: { [Op.gte]: 18 } });
    });

    it('puts Op.lt in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        age: { [Op.lt]: 65 },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ age: { [Op.lt]: 65 } });
    });

    it('puts Op.lte in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        age: { [Op.lte]: 65 },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ age: { [Op.lte]: 65 } });
    });

    it('puts Op.ne in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        status: { [Op.ne]: 'deleted' },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ status: { [Op.ne]: 'deleted' } });
    });

    it('puts Op.in in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        status: { [Op.in]: ['active', 'pending'] },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({
        status: { [Op.in]: ['active', 'pending'] },
      });
    });

    it('puts Op._in in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        tags: { [Op._in]: 'important' },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ tags: { [Op._in]: 'important' } });
    });

    it('puts Op.contains in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: { [Op.contains]: 'foo' },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ name: { [Op.contains]: 'foo' } });
    });

    it('handles mixed eq and non-eq properties', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: 'John',
        age: { [Op.gte]: 18 },
        status: 'active',
      });

      expect(eqParams).toEqual({ name: 'John', status: 'active' });
      expect(nonEqParams).toEqual({ age: { [Op.gte]: 18 } });
    });

    it('puts property with multiple non-eq operators in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        age: { [Op.gte]: 18, [Op.lte]: 65 },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ age: { [Op.gte]: 18, [Op.lte]: 65 } });
    });

    it('puts property with mixed eq and non-eq operators in nonEqParams', () => {
      // When a property has both eq AND non-eq, it goes to nonEqParams
      const { eqParams, nonEqParams } = Where.splitByOperator({
        status: { [Op.eq]: 'active', [Op.ne]: 'banned' },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({
        status: { [Op.eq]: 'active', [Op.ne]: 'banned' },
      });
    });

    it('handles complex mixed params', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: 'John',
        email: { [Op.eq]: 'john@example.com' },
        age: { [Op.gte]: 18, [Op.lte]: 65 },
        status: { [Op.in]: ['active', 'pending'] },
        role: 'admin',
      });

      expect(eqParams).toEqual({
        name: 'John',
        email: { [Op.eq]: 'john@example.com' },
        role: 'admin',
      });
      expect(nonEqParams).toEqual({
        age: { [Op.gte]: 18, [Op.lte]: 65 },
        status: { [Op.in]: ['active', 'pending'] },
      });
    });

    it('returns empty objects for empty input', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({});

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({});
    });
  });
});
