/* eslint-disable @typescript-eslint/ban-ts-comment */
import { typeCheck } from '../ModelFactory/testHelpers';
import { randomSuffix, trimWhitespace } from '../utils/string';
import type { WhereValuesI } from '.';
import { isAnyOperator, isOperator, Op, Where } from '.';

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

    it('generates IS NULL statement with Op.is', () => {
      const where = new Where({
        identifier: {
          deleted: { [Op.is]: null },
        },
      });

      expect(where.getStatement('text')).toBe('identifier.deleted IS NULL');
      // is operator should not add any bind params
      expect(where.getBindParam().get()).toEqual({});
    });

    it('generates IS NULL statement with direct null value', () => {
      const where = new Where({
        identifier: {
          deleted: null,
        },
      });

      expect(where.getStatement('text')).toBe('identifier.deleted IS NULL');
      // null should not add any bind params
      expect(where.getBindParam().get()).toEqual({});
    });

    it('generates IS NOT NULL statement with Op.isNot', () => {
      const where = new Where({
        identifier: {
          deletedAt: { [Op.isNot]: null },
        },
      });

      expect(where.getStatement('text')).toBe(
        'identifier.deletedAt IS NOT NULL',
      );
      // isNot operator should not add any bind params
      expect(where.getBindParam().get()).toEqual({});
    });

    it('translates Op.eq with null to IS NULL', () => {
      const where = new Where({
        identifier: {
          deleted: { [Op.eq]: null },
        },
      });

      expect(where.getStatement('text')).toBe('identifier.deleted IS NULL');
      expect(where.getBindParam().get()).toEqual({});
    });

    it('translates Op.ne with null to IS NOT NULL', () => {
      const where = new Where({
        identifier: {
          deleted: { [Op.ne]: null },
        },
      });

      expect(where.getStatement('text')).toBe('identifier.deleted IS NOT NULL');
      expect(where.getBindParam().get()).toEqual({});
    });

    it('combines is/isNot with other operators', () => {
      const where = new Where({
        node: {
          name: 'John',
          deleted: { [Op.is]: null },
          createdAt: { [Op.isNot]: null },
          age: { [Op.gte]: 18 },
        },
      });

      const statement = where.getStatement('text');
      expect(statement).toContain('node.name = $name');
      expect(statement).toContain('node.deleted IS NULL');
      expect(statement).toContain('node.createdAt IS NOT NULL');
      expect(statement).toContain('node.age >= $age');

      // Only name and age should be in bind params
      expect(where.getBindParam().get()).toEqual({
        name: 'John',
        age: 18,
      });
    });

    it('combines direct null with other operators', () => {
      const where = new Where({
        node: {
          name: 'John',
          deleted: null, // Direct null = IS NULL
          age: { [Op.gte]: 18 },
        },
      });

      const statement = where.getStatement('text');
      expect(statement).toContain('node.name = $name');
      expect(statement).toContain('node.deleted IS NULL');
      expect(statement).toContain('node.age >= $age');

      // Only name and age should be in bind params
      expect(where.getBindParam().get()).toEqual({
        name: 'John',
        age: 18,
      });
    });

    it('throws error when using is in object mode', () => {
      const where = new Where({
        identifier: {
          deleted: { [Op.is]: null },
        },
      });

      expect(() => where.getStatement('object')).toThrow(
        'The only operator which is supported for object mode is "eq"',
      );
    });

    it('throws error when using isNot in object mode', () => {
      const where = new Where({
        identifier: {
          deletedAt: { [Op.isNot]: null },
        },
      });

      expect(() => where.getStatement('object')).toThrow(
        'The only operator which is supported for object mode is "eq"',
      );
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
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'The only operator which is supported for object mode is "eq"',
        );
      }
    });

    it('supports multiple operators including null check on same property', () => {
      // Edge case: combining Op.isNot with another operator on same property
      // This tests that null-check handling doesn't short-circuit and drop other operators
      const where = new Where({
        node: {
          status: {
            [Op.isNot]: null,
            [Op.ne]: 'banned',
          },
        },
      });

      const statement = where.getStatement('text');
      expect(statement).toContain('node.status IS NOT NULL');
      expect(statement).toContain('node.status <> $status');

      // Only 'banned' should be in bind params, not null
      expect(where.getBindParam().get()).toEqual({ status: 'banned' });
    });

    it('supports Op.is with other operators on same property', () => {
      // This is a weird edge case but should be handled correctly
      const where = new Where({
        node: {
          value: {
            [Op.is]: null,
            [Op.eq]: 'fallback',
          },
        },
      });

      const statement = where.getStatement('text');
      expect(statement).toContain('node.value IS NULL');
      expect(statement).toContain('node.value = $value');
    });

    it('supports Op.eq with null alongside Op.ne with non-null', () => {
      const where = new Where({
        node: {
          deleted: {
            [Op.eq]: null,
            [Op.ne]: 'permanently',
          },
        },
      });

      const statement = where.getStatement('text');
      // Op.eq: null translates to IS NULL
      expect(statement).toContain('node.deleted IS NULL');
      expect(statement).toContain('node.deleted <> $deleted');
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

  it('ignores undefined values but treats null as IS NULL', () => {
    const undefinedIdentifier = 'ui_' + randomSuffix();
    const nullIdentifier = 'ni_' + randomSuffix();

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
    // undefined is ignored - no filter for that property
    expect(
      where.getStatement('text').includes(undefinedIdentifier),
    ).toBeFalsy();
    // null generates IS NULL
    expect(
      where
        .getStatement('text')
        .includes(`identifier.${nullIdentifier} IS NULL`),
    ).toBeTruthy();
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

      it('accepts valid Op.is', () => {
        const where = new Where({
          node: { deleted: { [Op.is]: null } },
        });
        expect(where.getStatement('text')).toContain('node.deleted IS NULL');
      });

      it('accepts valid Op.isNot', () => {
        const where = new Where({
          node: { createdAt: { [Op.isNot]: null } },
        });
        expect(where.getStatement('text')).toContain(
          'node.createdAt IS NOT NULL',
        );
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

    describe('WhereValuesI array type safety', () => {
      it('accepts direct array value', () => {
        const value: WhereValuesI<string[]> = ['a', 'b', 'c'];
        expect(value).toEqual(['a', 'b', 'c']);
      });

      it('accepts Op.eq with array', () => {
        const value: WhereValuesI<string[]> = { [Op.eq]: ['a', 'b'] };
        expect(Op.eq in value).toBe(true);
      });

      it('accepts Op.ne with array', () => {
        const value: WhereValuesI<string[]> = { [Op.ne]: ['a', 'b'] };
        expect(Op.ne in value).toBe(true);
      });

      it('accepts Op._in with element type (element IN array)', () => {
        // Check if 'a' is in the array property
        const value: WhereValuesI<string[]> = { [Op._in]: 'a' };
        expect(Op._in in value).toBe(true);
      });

      it('accepts Op.in with array of arrays (T[][] for array property)', () => {
        // For array-typed properties, Op.in takes T[][] (array of possible array values).
        // This checks if the array property equals one of several possible arrays.
        // E.g., WHERE tags IN [['admin', 'user'], ['guest']]
        // This requires Neo4jSingleTypes[][] in WhereTypes['In'] even though
        // Neo4jSupportedTypes only goes up to Neo4jSingleTypes[].
        const value: WhereValuesI<string[]> = {
          [Op.in]: [
            ['a', 'b'],
            ['c', 'd'],
          ],
        };
        expect(Op.in in value).toBe(true);
      });

      it('accepts Op.in with number[][] for number[] property', () => {
        // Same pattern for number arrays
        const value: WhereValuesI<number[]> = {
          [Op.in]: [
            [1, 2, 3],
            [4, 5, 6],
          ],
        };
        expect(Op.in in value).toBe(true);
      });

      it('rejects Op.contains for arrays (type check only)', () => {
        // Op.contains is for string substring matching, NOT array membership
        typeCheck(() => {
          // @ts-expect-error - Op.contains is not valid for array types
          const _value: WhereValuesI<string[]> = { [Op.contains]: 'a' };
        });
        expect(true).toBe(true);
      });

      it('rejects Op.gt for arrays (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.gt is not valid for array types
          const _value: WhereValuesI<string[]> = { [Op.gt]: ['a'] };
        });
        expect(true).toBe(true);
      });

      it('rejects Op.gte for arrays (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.gte is not valid for array types
          const _value: WhereValuesI<string[]> = { [Op.gte]: ['a'] };
        });
        expect(true).toBe(true);
      });

      it('rejects Op.lt for arrays (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.lt is not valid for array types
          const _value: WhereValuesI<string[]> = { [Op.lt]: ['a'] };
        });
        expect(true).toBe(true);
      });

      it('rejects Op.lte for arrays (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.lte is not valid for array types
          const _value: WhereValuesI<string[]> = { [Op.lte]: ['a'] };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong element type for Op._in (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op._in expects string, not number
          const _value: WhereValuesI<string[]> = { [Op._in]: 123 };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong array element type for Op.eq (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.eq expects string[], not number[]
          const _value: WhereValuesI<string[]> = { [Op.eq]: [1, 2, 3] };
        });
        expect(true).toBe(true);
      });

      it('accepts number[] array type', () => {
        const value: WhereValuesI<number[]> = [1, 2, 3];
        expect(value).toEqual([1, 2, 3]);

        const valueWithOp: WhereValuesI<number[]> = { [Op._in]: 42 };
        expect(Op._in in valueWithOp).toBe(true);
      });

      it('rejects mixing element types (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - number[] cannot contain strings
          const _value: WhereValuesI<number[]> = { [Op.eq]: ['a', 'b'] };
        });
        expect(true).toBe(true);
      });

      it('accepts empty array', () => {
        const value: WhereValuesI<string[]> = [];
        expect(value).toEqual([]);
      });

      it('accepts Op.is for array types', () => {
        const value: WhereValuesI<string[]> = { [Op.is]: null };
        expect(Op.is in value).toBe(true);
      });

      it('accepts Op.isNot for array types', () => {
        const value: WhereValuesI<string[]> = { [Op.isNot]: null };
        expect(Op.isNot in value).toBe(true);
      });

      it('accepts boolean[] array type', () => {
        const value: WhereValuesI<boolean[]> = [true, false, true];
        expect(value).toEqual([true, false, true]);

        const valueWithOp: WhereValuesI<boolean[]> = { [Op._in]: true };
        expect(Op._in in valueWithOp).toBe(true);
      });

      it('accepts optional array type (string[] | undefined)', () => {
        // Optional arrays should behave the same as required arrays
        const value: WhereValuesI<string[] | undefined> = ['a', 'b'];
        expect(value).toEqual(['a', 'b']);

        const valueWithOp: WhereValuesI<string[] | undefined> = {
          [Op._in]: 'element',
        };
        expect(Op._in in valueWithOp).toBe(true);
      });

      it('rejects single element when array is expected (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - expects string[], not string
          const _value: WhereValuesI<string[]> = 'single';
        });
        expect(true).toBe(true);
      });

      it('rejects wrong nested array type for Op.in (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.in expects string[][], not number[][]
          const _value: WhereValuesI<string[]> = {
            [Op.in]: [
              [1, 2],
              [3, 4],
            ],
          };
        });
        expect(true).toBe(true);
      });
    });

    describe('WhereValuesI scalar type safety', () => {
      it('accepts direct string value', () => {
        const value: WhereValuesI<string> = 'hello';
        expect(value).toBe('hello');
      });

      it('accepts direct number value', () => {
        const value: WhereValuesI<number> = 42;
        expect(value).toBe(42);
      });

      it('accepts direct boolean value', () => {
        const value: WhereValuesI<boolean> = true;
        expect(value).toBe(true);
      });

      it('accepts array of values (treated as equality at runtime)', () => {
        // Note: Direct arrays are treated as equality (=) at runtime, NOT as IN.
        // Use { [Op.in]: values } or Where.ensureIn() for IN queries.
        const value: WhereValuesI<string> = ['a', 'b', 'c'];
        expect(value).toEqual(['a', 'b', 'c']);
      });

      it('accepts Op.eq with matching type', () => {
        const strValue: WhereValuesI<string> = { [Op.eq]: 'test' };
        expect(Op.eq in strValue).toBe(true);

        const numValue: WhereValuesI<number> = { [Op.eq]: 123 };
        expect(Op.eq in numValue).toBe(true);
      });

      it('accepts Op.ne with matching type', () => {
        const value: WhereValuesI<string> = { [Op.ne]: 'excluded' };
        expect(Op.ne in value).toBe(true);
      });

      it('accepts Op.in with array of matching type', () => {
        const value: WhereValuesI<string> = { [Op.in]: ['a', 'b', 'c'] };
        expect(Op.in in value).toBe(true);
      });

      it('accepts Op._in with matching type', () => {
        const value: WhereValuesI<string> = { [Op._in]: 'element' };
        expect(Op._in in value).toBe(true);
      });

      it('accepts Op.contains with string', () => {
        const value: WhereValuesI<string> = { [Op.contains]: 'substring' };
        expect(Op.contains in value).toBe(true);
      });

      it('accepts Op.gt with number', () => {
        const value: WhereValuesI<number> = { [Op.gt]: 10 };
        expect(Op.gt in value).toBe(true);
      });

      it('accepts Op.gte with number', () => {
        const value: WhereValuesI<number> = { [Op.gte]: 10 };
        expect(Op.gte in value).toBe(true);
      });

      it('accepts Op.lt with number', () => {
        const value: WhereValuesI<number> = { [Op.lt]: 100 };
        expect(Op.lt in value).toBe(true);
      });

      it('accepts Op.lte with number', () => {
        const value: WhereValuesI<number> = { [Op.lte]: 100 };
        expect(Op.lte in value).toBe(true);
      });

      it('rejects wrong type for Op.eq (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.eq expects string, not number
          const _value: WhereValuesI<string> = { [Op.eq]: 123 };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.ne (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.ne expects number, not string
          const _value: WhereValuesI<number> = { [Op.ne]: 'wrong' };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong array element type for Op.in (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.in expects string[], not number[]
          const _value: WhereValuesI<string> = { [Op.in]: [1, 2, 3] };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op._in (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op._in expects string, not boolean
          const _value: WhereValuesI<string> = { [Op._in]: true };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.contains (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.contains expects string, not number
          const _value: WhereValuesI<string> = { [Op.contains]: 123 };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.gt (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.gt expects number, not string
          const _value: WhereValuesI<number> = { [Op.gt]: 'ten' };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.gte (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.gte expects number, not boolean
          const _value: WhereValuesI<number> = { [Op.gte]: true };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.lt (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.lt expects number, not string
          const _value: WhereValuesI<number> = { [Op.lt]: 'hundred' };
        });
        expect(true).toBe(true);
      });

      it('rejects wrong type for Op.lte (type check only)', () => {
        typeCheck(() => {
          // @ts-expect-error - Op.lte expects number, not object
          const _value: WhereValuesI<number> = { [Op.lte]: { value: 100 } };
        });
        expect(true).toBe(true);
      });

      it('accepts optional scalar type (number | undefined)', () => {
        const value: WhereValuesI<number | undefined> = 42;
        expect(value).toBe(42);

        const valueWithOp: WhereValuesI<number | undefined> = { [Op.gte]: 10 };
        expect(Op.gte in valueWithOp).toBe(true);
      });

      it('rejects Op.contains for number types (type check only)', () => {
        // Op.contains is for string substring matching only
        typeCheck(() => {
          // @ts-expect-error - Op.contains is only valid for string types
          const _value: WhereValuesI<number> = { [Op.contains]: 5 };
        });
        expect(true).toBe(true);
      });

      it('rejects Op.contains for boolean types (type check only)', () => {
        // Op.contains is for string substring matching only
        typeCheck(() => {
          // @ts-expect-error - Op.contains is only valid for string types
          const _value: WhereValuesI<boolean> = { [Op.contains]: true };
        });
        expect(true).toBe(true);
      });
    });

    describe('WhereValuesI permissive mode (no type parameter)', () => {
      it('accepts string values', () => {
        const value: WhereValuesI = 'any string';
        expect(value).toBe('any string');
      });

      it('accepts number values', () => {
        const value: WhereValuesI = 42;
        expect(value).toBe(42);
      });

      it('accepts boolean values', () => {
        const value: WhereValuesI = true;
        expect(value).toBe(true);
      });

      it('accepts array values', () => {
        const value: WhereValuesI = [1, 2, 3];
        expect(value).toEqual([1, 2, 3]);
      });

      it('accepts any operator with any value', () => {
        const eqValue: WhereValuesI = { [Op.eq]: 'anything' };
        expect(Op.eq in eqValue).toBe(true);

        const gtValue: WhereValuesI = { [Op.gt]: 100 };
        expect(Op.gt in gtValue).toBe(true);

        const inValue: WhereValuesI = { [Op.in]: ['a', 'b'] };
        expect(Op.in in inValue).toBe(true);

        const containsValue: WhereValuesI = { [Op.contains]: 'sub' };
        expect(Op.contains in containsValue).toBe(true);
      });
    });

    describe('isAnyOperator helper', () => {
      it('returns true for Op.eq', () => {
        expect(isAnyOperator({ [Op.eq]: 'value' })).toBe(true);
      });

      it('returns true for Op.ne', () => {
        expect(isAnyOperator({ [Op.ne]: 'value' })).toBe(true);
      });

      it('returns true for Op.in', () => {
        expect(isAnyOperator({ [Op.in]: ['a', 'b'] })).toBe(true);
      });

      it('returns true for Op._in', () => {
        expect(isAnyOperator({ [Op._in]: 'element' })).toBe(true);
      });

      it('returns true for Op.contains', () => {
        expect(isAnyOperator({ [Op.contains]: 'sub' })).toBe(true);
      });

      it('returns true for Op.gt', () => {
        expect(isAnyOperator({ [Op.gt]: 10 })).toBe(true);
      });

      it('returns true for Op.gte', () => {
        expect(isAnyOperator({ [Op.gte]: 10 })).toBe(true);
      });

      it('returns true for Op.lt', () => {
        expect(isAnyOperator({ [Op.lt]: 100 })).toBe(true);
      });

      it('returns true for Op.lte', () => {
        expect(isAnyOperator({ [Op.lte]: 100 })).toBe(true);
      });

      it('returns true for Op.is', () => {
        expect(isAnyOperator({ [Op.is]: null })).toBe(true);
      });

      it('returns true for Op.isNot', () => {
        expect(isAnyOperator({ [Op.isNot]: null })).toBe(true);
      });

      it('returns false for direct string value', () => {
        expect(isAnyOperator('direct value')).toBe(false);
      });

      it('returns false for direct number value', () => {
        expect(isAnyOperator(42)).toBe(false);
      });

      it('returns false for direct boolean value', () => {
        expect(isAnyOperator(true)).toBe(false);
      });

      it('returns false for array (direct IN value)', () => {
        expect(isAnyOperator([1, 2, 3])).toBe(false);
      });

      it('returns false for null', () => {
        expect(isAnyOperator(null as unknown as WhereValuesI)).toBe(false);
      });

      it('returns false for plain object without operators', () => {
        expect(isAnyOperator({ foo: 'bar' } as unknown as WhereValuesI)).toBe(
          false,
        );
      });
    });

    describe('isOperator type guard strictness', () => {
      it('isOperator.is returns true only when value is null', () => {
        expect(isOperator.is({ [Op.is]: null })).toBe(true);
        // Invalid: Op.is with non-null value should return false at runtime
        // Cast to unknown to bypass TypeScript's compile-time checks
        expect(
          isOperator.is({ [Op.is]: true } as unknown as WhereValuesI),
        ).toBe(false);
        expect(
          isOperator.is({ [Op.is]: 'string' } as unknown as WhereValuesI),
        ).toBe(false);
        expect(isOperator.is({ [Op.is]: 0 } as unknown as WhereValuesI)).toBe(
          false,
        );
      });

      it('isOperator.isNot returns true only when value is null', () => {
        expect(isOperator.isNot({ [Op.isNot]: null })).toBe(true);
        // Invalid: Op.isNot with non-null value should return false at runtime
        // Cast to unknown to bypass TypeScript's compile-time checks
        expect(
          isOperator.isNot({ [Op.isNot]: true } as unknown as WhereValuesI),
        ).toBe(false);
        expect(
          isOperator.isNot({ [Op.isNot]: 'string' } as unknown as WhereValuesI),
        ).toBe(false);
        expect(
          isOperator.isNot({ [Op.isNot]: 0 } as unknown as WhereValuesI),
        ).toBe(false);
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

    it('puts Op.is in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        deleted: { [Op.is]: null },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ deleted: { [Op.is]: null } });
    });

    it('puts direct null in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        deleted: null,
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ deleted: null });
    });

    it('puts Op.isNot in nonEqParams', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        createdAt: { [Op.isNot]: null },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ createdAt: { [Op.isNot]: null } });
    });

    it('handles is/isNot with other params', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: 'John',
        deleted: { [Op.is]: null },
        status: 'active',
      });

      expect(eqParams).toEqual({ name: 'John', status: 'active' });
      expect(nonEqParams).toEqual({ deleted: { [Op.is]: null } });
    });

    it('puts Op.eq with null in nonEqParams (translates to IS NULL)', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        deleted: { [Op.eq]: null },
      });

      // Op.eq: null should go to nonEqParams because it becomes IS NULL
      // which can't use bracket syntax
      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ deleted: { [Op.eq]: null } });
    });

    it('puts Op.ne with null in nonEqParams (translates to IS NOT NULL)', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        deleted: { [Op.ne]: null },
      });

      // Op.ne: null should go to nonEqParams because it becomes IS NOT NULL
      // which can't use bracket syntax
      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({ deleted: { [Op.ne]: null } });
    });

    it('handles mixed Op.eq with null and non-null values', () => {
      const { eqParams, nonEqParams } = Where.splitByOperator({
        name: { [Op.eq]: 'John' }, // non-null → eqParams
        deleted: { [Op.eq]: null }, // null → nonEqParams
      });

      expect(eqParams).toEqual({ name: { [Op.eq]: 'John' } });
      expect(nonEqParams).toEqual({ deleted: { [Op.eq]: null } });
    });

    it('handles property with both null check and other operators', () => {
      // Property with Op.isNot (null check) and Op.ne (comparison)
      // Entire property goes to nonEqParams
      const { eqParams, nonEqParams } = Where.splitByOperator({
        status: { [Op.isNot]: null, [Op.ne]: 'banned' },
      });

      expect(eqParams).toEqual({});
      expect(nonEqParams).toEqual({
        status: { [Op.isNot]: null, [Op.ne]: 'banned' },
      });
    });
  });

  describe('injection prevention', () => {
    it('escapes property names with special characters', () => {
      const where = new Where({
        node: { 'prop}: DELETE (n); //': 'value' },
      });
      // Property is escaped with backticks
      expect(where.getStatement('text')).toContain(
        'node.`prop}: DELETE (n); //`',
      );
    });

    it('rejects identifier names with special characters', () => {
      expect(() => {
        new Where({
          'node}: DELETE (n); //': { prop: 'value' },
        });
      }).toThrow(
        /Invalid identifier.*Identifiers must contain only alphanumeric/,
      );
    });

    it('escapes property names starting with numbers', () => {
      const where = new Where({
        node: { '123prop': 'value' },
      });
      // Property is escaped with backticks
      expect(where.getStatement('text')).toContain('node.`123prop`');
    });

    it('does not escape valid property names with underscores', () => {
      const where = new Where({
        node: { my_prop: 'value' },
      });
      // Valid property is not escaped
      expect(where.getStatement('text')).toContain('node.my_prop');
      expect(where.getStatement('text')).not.toContain('`my_prop`');
    });

    it('accepts valid identifier names with underscores', () => {
      expect(() => {
        new Where({
          my_node: { prop: 'value' },
        });
      }).not.toThrow();
    });
  });
});
