import { BindParam } from '../../BindParam';
import { Where } from '../../Where';
import { neogma } from '../testHelpers';
import { getNodeStatement } from './getNodeStatement';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getNodeStatement', () => {
  describe('basic usage', () => {
    it('returns empty node for empty params', () => {
      const result = getNodeStatement({});
      expect(result).toBe('()');
    });

    it('generates node with identifier only', () => {
      const result = getNodeStatement({ identifier: 'n' });
      expect(result).toBe('(n)');
    });

    it('generates node with label only', () => {
      const result = getNodeStatement({ label: 'Person' });
      expect(result).toBe('(:Person)');
    });

    it('generates node with identifier and label', () => {
      const result = getNodeStatement({
        identifier: 'n',
        label: 'Person',
      });
      expect(result).toBe('(n:Person)');
    });
  });

  describe('inner string', () => {
    it('handles inner string parameter', () => {
      const result = getNodeStatement({
        identifier: 'n',
        label: 'Person',
        inner: '{ name: $name }',
      });
      expect(result).toBe('(n:Person { name: $name })');
    });

    it('handles inner string with only identifier', () => {
      const result = getNodeStatement({
        identifier: 'n',
        inner: '{ active: true }',
      });
      expect(result).toBe('(n { active: true })');
    });

    it('handles inner string with only label', () => {
      const result = getNodeStatement({
        label: 'Person',
        inner: '{ age: 25 }',
      });
      expect(result).toBe('(:Person { age: 25 })');
    });

    it('handles inner string alone', () => {
      const result = getNodeStatement({
        inner: '{ type: "test" }',
      });
      expect(result).toBe('({ type: "test" })');
    });
  });

  describe('inner Where instance', () => {
    it('handles Where instance as inner', () => {
      const bindParam = new BindParam();
      const where = new Where({ n: { name: 'John' } }, bindParam);
      const result = getNodeStatement({
        identifier: 'n',
        label: 'Person',
        inner: where,
      });
      expect(result).toContain('n:Person');
      expect(result).toContain('name: $name');
    });

    it('handles complex Where instance', () => {
      const bindParam = new BindParam();
      const where = new Where({ n: { name: 'John', age: 30 } }, bindParam);
      const result = getNodeStatement({
        identifier: 'n',
        inner: where,
      });
      expect(result).toContain('n');
      expect(result).toContain('name: $name');
      expect(result).toContain('age: $age');
    });
  });

  describe('inner properties with bindParam', () => {
    it('handles properties object with bindParam', () => {
      const bindParam = new BindParam();
      const result = getNodeStatement({
        identifier: 'n',
        label: 'Person',
        inner: {
          properties: { name: 'John', age: 30 },
          bindParam,
        },
      });
      expect(result).toContain('n:Person');
      expect(result).toContain('name: $name');
      expect(result).toContain('age: $age');
      expect(bindParam.get()).toEqual({ name: 'John', age: 30 });
    });

    it('handles properties alone', () => {
      const bindParam = new BindParam();
      const result = getNodeStatement({
        inner: {
          properties: { active: true },
          bindParam,
        },
      });
      expect(result).toBe('({ active: $active })');
      expect(bindParam.get()).toEqual({ active: true });
    });
  });

  describe('edge cases', () => {
    it('handles empty string identifier', () => {
      const result = getNodeStatement({ identifier: '' });
      expect(result).toBe('()');
    });

    it('handles empty string label', () => {
      const result = getNodeStatement({ label: '' });
      expect(result).toBe('()');
    });

    it('handles both empty strings', () => {
      const result = getNodeStatement({ identifier: '', label: '' });
      expect(result).toBe('()');
    });

    it('handles identifier with underscore', () => {
      const result = getNodeStatement({ identifier: 'my_node' });
      expect(result).toBe('(my_node)');
    });

    it('handles identifier with numbers', () => {
      const result = getNodeStatement({ identifier: 'node1' });
      expect(result).toBe('(node1)');
    });

    it('handles label with spaces (auto-escaped)', () => {
      // Labels with spaces are automatically escaped with backticks
      const result = getNodeStatement({ label: 'My Label' });
      expect(result).toBe('(:`My Label`)');
    });
  });

  describe('type safety', () => {
    it('rejects number identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not number
        getNodeStatement({ identifier: 123 });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number label', () => {
      const _typeCheck = () => {
        // @ts-expect-error - label must be string or undefined, not number
        getNodeStatement({ label: 456 });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects boolean identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not boolean
        getNodeStatement({ identifier: true });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects array identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not array
        getNodeStatement({ identifier: ['n'] });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number inner', () => {
      const _typeCheck = () => {
        // @ts-expect-error - inner must be string, Where, or properties object
        getNodeStatement({ identifier: 'n', inner: 123 });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects array inner', () => {
      const _typeCheck = () => {
        // @ts-expect-error - inner must be string, Where, or properties object
        getNodeStatement({ identifier: 'n', inner: [] });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid properties object', () => {
      const _typeCheck = () => {
        getNodeStatement({
          identifier: 'n',
          inner: {
            // @ts-expect-error - properties object must have properties and bindParam
            invalidKey: 'test',
          },
        });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
