import { neogma } from '../testHelpers';
import { getIdentifierWithLabel } from './getIdentifierWithLabel';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getIdentifierWithLabel', () => {
  describe('both identifier and label provided', () => {
    it('combines identifier and label', () => {
      const result = getIdentifierWithLabel('n', 'MyLabel');
      expect(result).toBe('n:MyLabel');
    });

    it('handles longer identifier names', () => {
      const result = getIdentifierWithLabel('myNode', 'Person');
      expect(result).toBe('myNode:Person');
    });

    it('auto-escapes label with spaces', () => {
      // Raw labels with special characters are automatically escaped
      const result = getIdentifierWithLabel('n', 'My Label');
      expect(result).toBe('n:`My Label`');
    });

    it('passes through pre-escaped label with spaces (no double-escaping)', () => {
      // Pre-escaped labels from getLabel() are not double-escaped
      const result = getIdentifierWithLabel('n', '`My Label`');
      expect(result).toBe('n:`My Label`');
    });
  });

  describe('only identifier provided', () => {
    it('returns just the identifier when label is undefined', () => {
      const result = getIdentifierWithLabel('n', undefined);
      expect(result).toBe('n');
    });

    it('returns just the identifier when label is empty string', () => {
      const result = getIdentifierWithLabel('n', '');
      expect(result).toBe('n');
    });
  });

  describe('only label provided', () => {
    it('returns colon plus label when identifier is undefined', () => {
      const result = getIdentifierWithLabel(undefined, 'MyLabel');
      expect(result).toBe(':MyLabel');
    });

    it('returns colon plus label when identifier is empty string', () => {
      const result = getIdentifierWithLabel('', 'MyLabel');
      expect(result).toBe(':MyLabel');
    });
  });

  describe('neither provided', () => {
    it('returns empty string when both are undefined', () => {
      const result = getIdentifierWithLabel(undefined, undefined);
      expect(result).toBe('');
    });

    it('returns empty string when both are empty strings', () => {
      const result = getIdentifierWithLabel('', '');
      expect(result).toBe('');
    });

    it('returns empty string when called with no arguments', () => {
      const result = getIdentifierWithLabel();
      expect(result).toBe('');
    });
  });

  describe('edge cases', () => {
    it('handles single character identifier', () => {
      const result = getIdentifierWithLabel('a', 'Label');
      expect(result).toBe('a:Label');
    });

    it('handles single character label', () => {
      const result = getIdentifierWithLabel('node', 'L');
      expect(result).toBe('node:L');
    });

    it('handles identifier with numbers', () => {
      const result = getIdentifierWithLabel('node1', 'Label');
      expect(result).toBe('node1:Label');
    });

    it('handles identifier with underscore', () => {
      const result = getIdentifierWithLabel('my_node', 'Label');
      expect(result).toBe('my_node:Label');
    });
  });

  describe('escaping behavior', () => {
    it('escapes identifier with special characters', () => {
      const result = getIdentifierWithLabel('my-node', 'Label');
      expect(result).toBe('`my-node`:Label');
    });

    it('does not escape valid identifier', () => {
      const result = getIdentifierWithLabel('validNode', 'Label');
      expect(result).toBe('validNode:Label');
    });

    it('escapes identifier starting with number', () => {
      const result = getIdentifierWithLabel('123node', 'Label');
      expect(result).toBe('`123node`:Label');
    });

    it('passes through pre-escaped labels unchanged (no double-escaping)', () => {
      // When using getLabel(), labels come pre-escaped with backticks
      const result = getIdentifierWithLabel('n', '`My Label`');
      expect(result).toBe('n:`My Label`');
    });

    it('auto-escapes raw labels with special characters', () => {
      // Raw labels are automatically escaped if needed
      const result = getIdentifierWithLabel('n', 'My Label');
      expect(result).toBe('n:`My Label`');
    });

    it('escapes both identifier and raw label', () => {
      const result = getIdentifierWithLabel('my-node', 'My Label');
      expect(result).toBe('`my-node`:`My Label`');
    });

    it('escapes identifier with pre-escaped label', () => {
      const result = getIdentifierWithLabel('my-node', '`My Label`');
      expect(result).toBe('`my-node`:`My Label`');
    });

    it('does not escape valid labels', () => {
      const result = getIdentifierWithLabel('n', 'Person');
      expect(result).toBe('n:Person');
    });

    it('escapes label starting with number', () => {
      const result = getIdentifierWithLabel('n', '123Label');
      expect(result).toBe('n:`123Label`');
    });

    it('escapes labels with backticks in them', () => {
      const result = getIdentifierWithLabel('n', 'Label`Injection');
      expect(result).toBe('n:`Label``Injection`');
    });
  });

  describe('type safety', () => {
    it('rejects number identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not number
        getIdentifierWithLabel(123, 'Label');
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number label', () => {
      const _typeCheck = () => {
        // @ts-expect-error - label must be string or undefined, not number
        getIdentifierWithLabel('n', 123);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects object identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not object
        getIdentifierWithLabel({ id: 'n' }, 'Label');
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects array identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not array
        getIdentifierWithLabel(['n'], 'Label');
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects boolean identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not boolean
        getIdentifierWithLabel(true, 'Label');
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects null identifier', () => {
      const _typeCheck = () => {
        // @ts-expect-error - identifier must be string or undefined, not null
        getIdentifierWithLabel(null, 'Label');
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
