import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { getPropertiesWithParams } from './getPropertiesWithParams';
import { neogma } from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getPropertiesWithParams', () => {
  describe('basic usage', () => {
    it('generates properties with single param', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ name: 'John' }, bindParam);
      expect(result).toBe('{ name: $name }');
      expect(bindParam.get()).toEqual({ name: 'John' });
    });

    it('generates properties with multiple params', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        { name: 'John', age: 30 },
        bindParam,
      );
      expect(result).toContain('name: $name');
      expect(result).toContain('age: $age');
      expect(result.startsWith('{')).toBe(true);
      expect(result.endsWith('}')).toBe(true);
      expect(bindParam.get()).toEqual({ name: 'John', age: 30 });
    });

    it('handles empty object', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({}, bindParam);
      expect(result).toBe('{  }');
    });
  });

  describe('data types', () => {
    it('handles string values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ name: 'Alice' }, bindParam);
      expect(result).toBe('{ name: $name }');
      expect(bindParam.get().name).toBe('Alice');
    });

    it('handles number values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ age: 25 }, bindParam);
      expect(result).toBe('{ age: $age }');
      expect(bindParam.get().age).toBe(25);
    });

    it('handles boolean values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ active: true }, bindParam);
      expect(result).toBe('{ active: $active }');
      expect(bindParam.get().active).toBe(true);
    });

    it('handles array values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ tags: ['a', 'b'] }, bindParam);
      expect(result).toBe('{ tags: $tags }');
      expect(bindParam.get().tags).toEqual(['a', 'b']);
    });

    it('handles float values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ score: 3.14 }, bindParam);
      expect(result).toBe('{ score: $score }');
      expect(bindParam.get().score).toBe(3.14);
    });

    it('handles negative numbers', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ balance: -100 }, bindParam);
      expect(result).toBe('{ balance: $balance }');
      expect(bindParam.get().balance).toBe(-100);
    });
  });

  describe('literal values', () => {
    it('handles Literal values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        { timestamp: new Literal('datetime()') },
        bindParam,
      );
      expect(result).toBe('{ timestamp: datetime() }');
      expect(bindParam.get()).toEqual({});
    });

    it('handles mixed Literal and regular values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        {
          name: 'John',
          createdAt: new Literal('datetime()'),
          age: 30,
        },
        bindParam,
      );
      expect(result).toContain('name: $name');
      expect(result).toContain('createdAt: datetime()');
      expect(result).toContain('age: $age');
      expect(bindParam.get()).toEqual({ name: 'John', age: 30 });
    });

    it('handles Literal with complex expression', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        { computed: new Literal('size(nodes)') },
        bindParam,
      );
      expect(result).toBe('{ computed: size(nodes) }');
    });

    it('handles multiple Literal values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        {
          created: new Literal('datetime()'),
          updated: new Literal('timestamp()'),
        },
        bindParam,
      );
      expect(result).toContain('created: datetime()');
      expect(result).toContain('updated: timestamp()');
      expect(bindParam.get()).toEqual({});
    });
  });

  describe('parameter naming', () => {
    it('uses unique names when bindParam already has values', () => {
      const bindParam = new BindParam({ name: 'existing' });
      const result = getPropertiesWithParams({ name: 'John' }, bindParam);
      expect(result).toContain('name: $name__aaaa');
      expect(bindParam.get().name).toBe('existing');
      expect(bindParam.get().name__aaaa).toBe('John');
    });

    it('handles multiple properties with existing params', () => {
      const bindParam = new BindParam({ name: 'existing', age: 20 });
      const result = getPropertiesWithParams(
        { name: 'John', age: 30 },
        bindParam,
      );
      expect(result).toContain('name: $name__aaaa');
      expect(result).toContain('age: $age__aaaa');
    });
  });

  describe('edge cases', () => {
    it('handles property names with underscores', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ first_name: 'John' }, bindParam);
      expect(result).toBe('{ first_name: $first_name }');
    });

    it('handles property names with numbers', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ prop1: 'value' }, bindParam);
      expect(result).toBe('{ prop1: $prop1 }');
    });

    it('handles empty string values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ name: '' }, bindParam);
      expect(result).toBe('{ name: $name }');
      expect(bindParam.get().name).toBe('');
    });

    it('handles zero values', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams({ count: 0 }, bindParam);
      expect(result).toBe('{ count: $count }');
      expect(bindParam.get().count).toBe(0);
    });

    it('handles many properties', () => {
      const bindParam = new BindParam();
      const result = getPropertiesWithParams(
        { a: 1, b: 2, c: 3, d: 4, e: 5 },
        bindParam,
      );
      expect(result).toContain('a: $a');
      expect(result).toContain('b: $b');
      expect(result).toContain('c: $c');
      expect(result).toContain('d: $d');
      expect(result).toContain('e: $e');
    });
  });

  describe('type safety', () => {
    it('rejects undefined data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data must be an object, not undefined
        getPropertiesWithParams(undefined, bindParam);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects null data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data must be an object, not null
        getPropertiesWithParams(null, bindParam);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects string data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data must be an object, not string
        getPropertiesWithParams('invalid', bindParam);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data must be an object, not number
        getPropertiesWithParams(123, bindParam);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects array data', () => {
      const _typeCheck = () => {
        const bindParam = new BindParam();
        // @ts-expect-error - data must be an object, not array
        getPropertiesWithParams(['a', 'b'], bindParam);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing bindParam', () => {
      const _typeCheck = () => {
        // @ts-expect-error - bindParam is required
        getPropertiesWithParams({ name: 'John' });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid bindParam type', () => {
      const _typeCheck = () => {
        // @ts-expect-error - bindParam must be a BindParam instance
        getPropertiesWithParams({ name: 'John' }, {});
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
