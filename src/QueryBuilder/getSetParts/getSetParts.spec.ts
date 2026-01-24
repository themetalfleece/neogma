import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { neogma } from '../testHelpers';
import { getSetParts } from './getSetParts';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getSetParts', () => {
  describe('basic usage', () => {
    it('generates SET parts for single property', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.name = $name']);
      expect(result.statement).toBe('SET n.name = $name');
      expect(bindParam.get()).toEqual({ name: 'John' });
    });

    it('generates SET parts for multiple properties', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John', age: 30 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toHaveLength(2);
      expect(result.parts).toContain('n.name = $name');
      expect(result.parts).toContain('n.age = $age');
      expect(result.statement).toBe('SET n.name = $name, n.age = $age');
      expect(bindParam.get()).toEqual({ name: 'John', age: 30 });
    });

    it('returns empty result for empty data', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: {},
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual([]);
      expect(result.statement).toBe('');
    });
  });

  describe('data types', () => {
    it('handles string values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { title: 'Manager' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.title = $title']);
      expect(bindParam.get().title).toBe('Manager');
    });

    it('handles number values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { count: 42 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.count = $count']);
      expect(bindParam.get().count).toBe(42);
    });

    it('handles boolean values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { active: true },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.active = $active']);
      expect(bindParam.get().active).toBe(true);
    });

    it('handles array values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { tags: ['a', 'b', 'c'] },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.tags = $tags']);
      expect(bindParam.get().tags).toEqual(['a', 'b', 'c']);
    });

    it('handles float values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { rating: 4.5 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.rating = $rating']);
      expect(bindParam.get().rating).toBe(4.5);
    });

    it('handles negative numbers', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { offset: -10 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.offset = $offset']);
      expect(bindParam.get().offset).toBe(-10);
    });
  });

  describe('literal values', () => {
    it('handles Literal values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { updatedAt: new Literal('datetime()') },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.updatedAt = datetime()']);
      expect(result.statement).toBe('SET n.updatedAt = datetime()');
      expect(bindParam.get()).toEqual({});
    });

    it('handles mixed Literal and regular values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: {
          name: 'John',
          updatedAt: new Literal('timestamp()'),
          age: 30,
        },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toContain('n.name = $name');
      expect(result.parts).toContain('n.updatedAt = timestamp()');
      expect(result.parts).toContain('n.age = $age');
      expect(bindParam.get()).toEqual({ name: 'John', age: 30 });
    });

    it('handles Literal with complex expression', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { count: new Literal('n.count + 1') },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.count = n.count + 1']);
    });

    it('handles multiple Literal values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: {
          createdAt: new Literal('datetime()'),
          updatedAt: new Literal('datetime()'),
        },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toContain('n.createdAt = datetime()');
      expect(result.parts).toContain('n.updatedAt = datetime()');
    });
  });

  describe('different identifiers', () => {
    it('uses provided identifier', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'person',
        bindParam,
      });
      expect(result.parts).toEqual(['person.name = $name']);
    });

    it('handles single letter identifier', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'a',
        bindParam,
      });
      expect(result.parts).toEqual(['a.name = $name']);
    });

    it('handles identifier with underscore', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'my_node',
        bindParam,
      });
      expect(result.parts).toEqual(['my_node.name = $name']);
    });

    it('handles identifier with numbers', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'node1',
        bindParam,
      });
      expect(result.parts).toEqual(['node1.name = $name']);
    });
  });

  describe('parameter naming', () => {
    it('uses unique names when bindParam already has values', () => {
      const bindParam = new BindParam({ name: 'existing' });
      const result = getSetParts({
        data: { name: 'John' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.name = $name__aaaa']);
      expect(bindParam.get().name).toBe('existing');
      expect(bindParam.get().name__aaaa).toBe('John');
    });

    it('handles multiple properties with existing params', () => {
      const bindParam = new BindParam({ name: 'existing', age: 20 });
      const result = getSetParts({
        data: { name: 'John', age: 30 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toContain('n.name = $name__aaaa');
      expect(result.parts).toContain('n.age = $age__aaaa');
    });
  });

  describe('edge cases', () => {
    it('handles property names with underscores', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { first_name: 'John' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.first_name = $first_name']);
    });

    it('handles property names with numbers', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { prop1: 'value' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.prop1 = $prop1']);
    });

    it('handles empty string values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { name: '' },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.name = $name']);
      expect(bindParam.get().name).toBe('');
    });

    it('handles zero values', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { count: 0 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual(['n.count = $count']);
      expect(bindParam.get().count).toBe(0);
    });

    it('handles many properties', () => {
      const bindParam = new BindParam();
      const result = getSetParts({
        data: { a: 1, b: 2, c: 3, d: 4, e: 5 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toHaveLength(5);
      expect(result.statement.startsWith('SET ')).toBe(true);
    });
  });

  describe('type safety', () => {
    it('rejects missing data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data is required
        getSetParts({ identifier: 'n', bindParam });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing identifier', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - identifier is required
        getSetParts({ data: { name: 'John' }, bindParam });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing bindParam', () => {
      const _typeCheck = () => {
        // @ts-expect-error - bindParam is required
        getSetParts({ data: { name: 'John' }, identifier: 'n' });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects null data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        getSetParts({
          // @ts-expect-error - data must be an object, not null
          data: null,
          identifier: 'n',
          bindParam,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects string data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        getSetParts({
          // @ts-expect-error - data must be an object, not string
          data: 'invalid',
          identifier: 'n',
          bindParam,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number identifier', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        getSetParts({
          data: { name: 'John' },
          // @ts-expect-error - identifier must be string
          identifier: 123,
          bindParam,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid bindParam', () => {
      const _typeCheck = () => {
        getSetParts({
          data: { name: 'John' },
          identifier: 'n',
          // @ts-expect-error - bindParam must be BindParam instance
          bindParam: {},
        });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
