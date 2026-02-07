import { BindParam } from '../../BindParam';
import { Op } from '../../Where';
import { ModelA, neogma } from '../testHelpers';
import { getNodeString } from './getNodeString';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getNodeString', () => {
  const createDeps = () => {
    const bindParam = new BindParam();
    return {
      bindParam,
      getBindParam: () => bindParam,
    };
  };

  describe('string input', () => {
    it('returns the string as-is when node is a string', () => {
      const deps = createDeps();
      const result = getNodeString('(n:Label)', deps);
      expect(result.statement).toBe('(n:Label)');
      expect(result.standaloneWhere).toBeNull();
    });

    it('handles empty string', () => {
      const deps = createDeps();
      const result = getNodeString('', deps);
      expect(result.statement).toBe('');
      expect(result.standaloneWhere).toBeNull();
    });

    it('handles complex string patterns', () => {
      const deps = createDeps();
      const result = getNodeString('(n:Label {prop: $value})', deps);
      expect(result.statement).toBe('(n:Label {prop: $value})');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('object input with label', () => {
    it('generates node string with label only', () => {
      const deps = createDeps();
      const result = getNodeString({ label: 'MyLabel' }, deps);
      expect(result.statement).toBe('(:MyLabel)');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates node string with identifier and label', () => {
      const deps = createDeps();
      const result = getNodeString({ identifier: 'n', label: 'MyLabel' }, deps);
      expect(result.statement).toBe('(n:MyLabel)');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('object input with model', () => {
    it('generates node string with model', () => {
      const deps = createDeps();
      const result = getNodeString({ model: ModelA }, deps);
      expect(result.statement).toBe('(:`ModelA`)');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates node string with identifier and model', () => {
      const deps = createDeps();
      const result = getNodeString({ identifier: 'a', model: ModelA }, deps);
      expect(result.statement).toBe('(a:`ModelA`)');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('object input with where', () => {
    it('generates node string with where clause', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'n', where: { id: '123' } },
        deps,
      );
      expect(result.statement).toBe('(n { id: $id })');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({ id: '123' });
    });

    it('generates node string with label and where', () => {
      const deps = createDeps();
      const result = getNodeString(
        { label: 'MyLabel', where: { name: 'test' } },
        deps,
      );
      expect(result.statement).toBe('(:MyLabel { name: $name })');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({ name: 'test' });
    });

    it('generates node string with multiple where properties', () => {
      const deps = createDeps();
      const result = getNodeString(
        {
          identifier: 'n',
          label: 'Person',
          where: { name: 'John', age: 30 },
        },
        deps,
      );
      expect(result.statement).toBe('(n:Person { name: $name, age: $age })');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('object input with properties', () => {
    it('generates node string with properties', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'n', properties: { name: 'test' } },
        deps,
      );
      expect(result.statement).toBe('(n { name: $name })');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({ name: 'test' });
    });

    it('generates node string with multiple properties', () => {
      const deps = createDeps();
      const result = getNodeString(
        {
          identifier: 'n',
          label: 'Person',
          properties: { name: 'John', age: 25, active: true },
        },
        deps,
      );
      expect(result.statement).toContain('(n:Person {');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({
        name: 'John',
        age: 25,
        active: true,
      });
    });
  });

  describe('empty object', () => {
    it('generates empty node statement for empty object', () => {
      const deps = createDeps();
      const result = getNodeString({}, deps);
      expect(result.statement).toBe('()');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates node with only identifier', () => {
      const deps = createDeps();
      const result = getNodeString({ identifier: 'n' }, deps);
      expect(result.statement).toBe('(n)');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('non-eq operators', () => {
    it('returns standaloneWhere for non-eq operators', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'n', label: 'Node', where: { age: { [Op.gt]: 18 } } },
        deps,
      );
      expect(result.statement).toBe('(n:Node)');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe('n.age > $age');
    });

    it('splits eq and non-eq operators', () => {
      const deps = createDeps();
      const result = getNodeString(
        {
          identifier: 'n',
          label: 'Node',
          where: { name: 'John', age: { [Op.gte]: 18 } },
        },
        deps,
      );
      expect(result.statement).toBe('(n:Node { name: $name })');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe(
        'n.age >= $age',
      );
      expect(deps.bindParam.get()).toEqual({ name: 'John', age: 18 });
    });

    it('generates unique identifier for non-eq without identifier', () => {
      const deps = createDeps();
      const result = getNodeString(
        { label: 'Node', where: { age: { [Op.gt]: 18 } } },
        deps,
      );
      // Should generate identifier __n
      expect(result.statement).toBe('(__n:Node)');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe(
        '__n.age > $age',
      );
    });

    it('uses shared BindParam for auto-generated identifier', () => {
      const deps = createDeps();
      const result = getNodeString(
        { label: 'Node', where: { age: { [Op.gt]: 18 } } },
        deps,
      );

      // The age value should be in the shared bindParam
      expect(deps.bindParam.get()).toEqual({ age: 18 });

      // The generated identifier should use the bindParam's getUniqueName
      expect(result.statement).toBe('(__n:Node)');
    });
  });

  describe('type safety', () => {
    it('rejects invalid node type', () => {
      const _typeCheck = () => {
        const deps = createDeps();
        // @ts-expect-error - node must be string or object, not number
        getNodeString(123, deps);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid identifier type', () => {
      const _typeCheck = () => {
        const deps = createDeps();
        // @ts-expect-error - identifier must be string, not number
        getNodeString({ identifier: 123 }, deps);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid label type', () => {
      const _typeCheck = () => {
        const deps = createDeps();
        // @ts-expect-error - label must be string, not number
        getNodeString({ label: 123 }, deps);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('escapes where when invalid type passed', () => {
      const deps = createDeps();
      // @ts-expect-error - where must be object, not string
      // When a string is passed, JS iterates it with indices as property names
      // These are escaped since they start with numbers (not valid identifiers)
      const result = getNodeString({ where: 'invalid' }, deps);
      // The string "invalid" is treated as { 0: 'i', 1: 'n', ... } - indices get escaped
      expect(result.statement).toContain('`0`');
    });

    it('escapes properties when invalid type passed', () => {
      const deps = createDeps();
      // @ts-expect-error - properties must be object, not string
      // When a string is passed, JS iterates it as an object with indices "0", "1", etc.
      // These are escaped since they start with numbers (not valid identifiers)
      const result = getNodeString({ properties: 'invalid' }, deps);
      // The string "invalid" is treated as { 0: 'i', 1: 'n', ... } - indices get escaped
      expect(result.statement).toContain('`0`');
    });
  });
});
