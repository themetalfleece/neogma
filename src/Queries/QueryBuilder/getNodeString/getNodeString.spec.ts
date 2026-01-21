import { BindParam } from '../../BindParam';
import { getNodeString } from './getNodeString';
import { ModelA, neogma } from '../testHelpers';

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
      expect(result).toBe('(n:Label)');
    });

    it('handles empty string', () => {
      const deps = createDeps();
      const result = getNodeString('', deps);
      expect(result).toBe('');
    });

    it('handles complex string patterns', () => {
      const deps = createDeps();
      const result = getNodeString('(n:Label {prop: $value})', deps);
      expect(result).toBe('(n:Label {prop: $value})');
    });
  });

  describe('object input with label', () => {
    it('generates node string with label only', () => {
      const deps = createDeps();
      const result = getNodeString({ label: 'MyLabel' }, deps);
      expect(result).toBe('(:MyLabel)');
    });

    it('generates node string with identifier and label', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'n', label: 'MyLabel' },
        deps,
      );
      expect(result).toBe('(n:MyLabel)');
    });
  });

  describe('object input with model', () => {
    it('generates node string with model', () => {
      const deps = createDeps();
      const result = getNodeString({ model: ModelA }, deps);
      expect(result).toBe('(:`ModelA`)');
    });

    it('generates node string with identifier and model', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'a', model: ModelA },
        deps,
      );
      expect(result).toBe('(a:`ModelA`)');
    });
  });

  describe('object input with where', () => {
    it('generates node string with where clause', () => {
      const deps = createDeps();
      const result = getNodeString(
        { identifier: 'n', where: { id: '123' } },
        deps,
      );
      expect(result).toBe('(n { id: $id })');
      expect(deps.bindParam.get()).toEqual({ id: '123' });
    });

    it('generates node string with label and where', () => {
      const deps = createDeps();
      const result = getNodeString(
        { label: 'MyLabel', where: { name: 'test' } },
        deps,
      );
      expect(result).toBe('(:MyLabel { name: $name })');
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
      expect(result).toBe('(n:Person { name: $name, age: $age })');
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
      expect(result).toBe('(n { name: $name })');
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
      expect(result).toContain('(n:Person {');
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
      expect(result).toBe('()');
    });

    it('generates node with only identifier', () => {
      const deps = createDeps();
      const result = getNodeString({ identifier: 'n' }, deps);
      expect(result).toBe('(n)');
    });
  });

  describe('type safety', () => {
    it('rejects invalid node type', () => {
      const deps = createDeps();
      // @ts-expect-error - node must be string or object, not number
      void getNodeString(123, deps);
    });

    it('rejects invalid identifier type', () => {
      const deps = createDeps();
      // @ts-expect-error - identifier must be string, not number
      void getNodeString({ identifier: 123 }, deps);
    });

    it('rejects invalid label type', () => {
      const deps = createDeps();
      // @ts-expect-error - label must be string, not number
      void getNodeString({ label: 123 }, deps);
    });

    it('rejects invalid where type', () => {
      const deps = createDeps();
      // @ts-expect-error - where must be object, not string
      void getNodeString({ where: 'invalid' }, deps);
    });

    it('rejects invalid properties type', () => {
      const deps = createDeps();
      // @ts-expect-error - properties must be object, not string
      void getNodeString({ properties: 'invalid' }, deps);
    });
  });
});
