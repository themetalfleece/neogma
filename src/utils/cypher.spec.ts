import { NeogmaError } from '../Errors';
import {
  assertValidCypherIdentifier,
  escapeCypherIdentifier,
  escapeIfNeeded,
  escapeLabelIfNeeded,
  isAlreadyEscaped,
  isValidCypherIdentifier,
  sanitizeParamName,
} from './cypher';

describe('cypher utilities', () => {
  describe('isValidCypherIdentifier', () => {
    describe('valid identifiers', () => {
      it('accepts simple lowercase names', () => {
        expect(isValidCypherIdentifier('name')).toBe(true);
        expect(isValidCypherIdentifier('age')).toBe(true);
        expect(isValidCypherIdentifier('id')).toBe(true);
      });

      it('accepts uppercase names', () => {
        expect(isValidCypherIdentifier('Name')).toBe(true);
        expect(isValidCypherIdentifier('NAME')).toBe(true);
        expect(isValidCypherIdentifier('MyProperty')).toBe(true);
      });

      it('accepts names with underscores', () => {
        expect(isValidCypherIdentifier('first_name')).toBe(true);
        expect(isValidCypherIdentifier('last_name')).toBe(true);
        expect(isValidCypherIdentifier('user_id')).toBe(true);
        expect(isValidCypherIdentifier('_private')).toBe(true);
        expect(isValidCypherIdentifier('__dunder__')).toBe(true);
      });

      it('accepts names with numbers (not at start)', () => {
        expect(isValidCypherIdentifier('prop1')).toBe(true);
        expect(isValidCypherIdentifier('value123')).toBe(true);
        expect(isValidCypherIdentifier('a1b2c3')).toBe(true);
      });

      it('accepts single character names', () => {
        expect(isValidCypherIdentifier('n')).toBe(true);
        expect(isValidCypherIdentifier('m')).toBe(true);
        expect(isValidCypherIdentifier('_')).toBe(true);
      });
    });

    describe('invalid identifiers', () => {
      it('rejects names starting with numbers', () => {
        expect(isValidCypherIdentifier('123abc')).toBe(false);
        expect(isValidCypherIdentifier('1prop')).toBe(false);
        expect(isValidCypherIdentifier('0')).toBe(false);
      });

      it('rejects names with dashes', () => {
        expect(isValidCypherIdentifier('my-prop')).toBe(false);
        expect(isValidCypherIdentifier('first-name')).toBe(false);
        expect(isValidCypherIdentifier('kebab-case')).toBe(false);
      });

      it('rejects names with spaces', () => {
        expect(isValidCypherIdentifier('my prop')).toBe(false);
        expect(isValidCypherIdentifier('first name')).toBe(false);
        expect(isValidCypherIdentifier(' leading')).toBe(false);
        expect(isValidCypherIdentifier('trailing ')).toBe(false);
      });

      it('rejects names with special characters', () => {
        expect(isValidCypherIdentifier('prop!')).toBe(false);
        expect(isValidCypherIdentifier('prop@value')).toBe(false);
        expect(isValidCypherIdentifier('prop#1')).toBe(false);
        expect(isValidCypherIdentifier('prop$var')).toBe(false);
        expect(isValidCypherIdentifier('prop%')).toBe(false);
        expect(isValidCypherIdentifier('prop^')).toBe(false);
        expect(isValidCypherIdentifier('prop&')).toBe(false);
        expect(isValidCypherIdentifier('prop*')).toBe(false);
        expect(isValidCypherIdentifier('prop()')).toBe(false);
        expect(isValidCypherIdentifier('prop[]')).toBe(false);
        expect(isValidCypherIdentifier('prop{}')).toBe(false);
      });

      it('rejects names with dots', () => {
        expect(isValidCypherIdentifier('a.b')).toBe(false);
        expect(isValidCypherIdentifier('node.property')).toBe(false);
      });

      it('rejects names with backticks', () => {
        expect(isValidCypherIdentifier('`name`')).toBe(false);
        expect(isValidCypherIdentifier('prop`value')).toBe(false);
      });

      it('rejects injection attempts', () => {
        expect(isValidCypherIdentifier('name; DROP DATABASE')).toBe(false);
        expect(isValidCypherIdentifier('prop} RETURN n //')).toBe(false);
        expect(isValidCypherIdentifier("'; DELETE (n); //")).toBe(false);
      });

      it('rejects empty strings', () => {
        expect(isValidCypherIdentifier('')).toBe(false);
      });
    });
  });

  describe('escapeCypherIdentifier', () => {
    it('wraps simple names in backticks', () => {
      expect(escapeCypherIdentifier('name')).toBe('`name`');
      expect(escapeCypherIdentifier('age')).toBe('`age`');
    });

    it('wraps names with spaces in backticks', () => {
      expect(escapeCypherIdentifier('first name')).toBe('`first name`');
      expect(escapeCypherIdentifier('My Label')).toBe('`My Label`');
    });

    it('wraps names with dashes in backticks', () => {
      expect(escapeCypherIdentifier('my-prop')).toBe('`my-prop`');
      expect(escapeCypherIdentifier('kebab-case')).toBe('`kebab-case`');
    });

    it('wraps names starting with numbers in backticks', () => {
      expect(escapeCypherIdentifier('123abc')).toBe('`123abc`');
      expect(escapeCypherIdentifier('0')).toBe('`0`');
    });

    it('escapes internal backticks by doubling them', () => {
      expect(escapeCypherIdentifier('test`injection')).toBe(
        '`test``injection`',
      );
      expect(escapeCypherIdentifier('a`b`c')).toBe('`a``b``c`');
      expect(escapeCypherIdentifier('`')).toBe('````');
      expect(escapeCypherIdentifier('``')).toBe('``````');
    });

    it('handles injection attempts safely', () => {
      expect(escapeCypherIdentifier('name; DROP DATABASE')).toBe(
        '`name; DROP DATABASE`',
      );
      expect(escapeCypherIdentifier("'; DELETE (n); //")).toBe(
        "`'; DELETE (n); //`",
      );
      // Backticks in injection attempts are escaped
      expect(escapeCypherIdentifier('prop` RETURN n //`')).toBe(
        '`prop`` RETURN n //```',
      );
    });

    it('handles empty strings', () => {
      expect(escapeCypherIdentifier('')).toBe('``');
    });

    it('handles unicode characters', () => {
      expect(escapeCypherIdentifier('名前')).toBe('`名前`');
      expect(escapeCypherIdentifier('émoji 🎉')).toBe('`émoji 🎉`');
    });
  });

  describe('escapeIfNeeded', () => {
    describe('valid identifiers - no escaping', () => {
      it('returns valid names unchanged', () => {
        expect(escapeIfNeeded('name')).toBe('name');
        expect(escapeIfNeeded('first_name')).toBe('first_name');
        expect(escapeIfNeeded('prop1')).toBe('prop1');
        expect(escapeIfNeeded('MyProperty')).toBe('MyProperty');
        expect(escapeIfNeeded('_private')).toBe('_private');
      });

      it('returns single characters unchanged', () => {
        expect(escapeIfNeeded('n')).toBe('n');
        expect(escapeIfNeeded('_')).toBe('_');
      });
    });

    describe('invalid identifiers - escapes', () => {
      it('escapes names starting with numbers', () => {
        expect(escapeIfNeeded('123abc')).toBe('`123abc`');
        expect(escapeIfNeeded('0prop')).toBe('`0prop`');
      });

      it('escapes names with dashes', () => {
        expect(escapeIfNeeded('my-prop')).toBe('`my-prop`');
        expect(escapeIfNeeded('kebab-case')).toBe('`kebab-case`');
      });

      it('escapes names with spaces', () => {
        expect(escapeIfNeeded('my prop')).toBe('`my prop`');
        expect(escapeIfNeeded('My Label')).toBe('`My Label`');
      });

      it('escapes names with special characters', () => {
        expect(escapeIfNeeded('prop!')).toBe('`prop!`');
        expect(escapeIfNeeded('prop@value')).toBe('`prop@value`');
      });

      it('escapes and doubles internal backticks', () => {
        expect(escapeIfNeeded('a`b')).toBe('`a``b`');
        expect(escapeIfNeeded('test`injection')).toBe('`test``injection`');
      });

      it('escapes injection attempts', () => {
        expect(escapeIfNeeded('name; DROP DATABASE')).toBe(
          '`name; DROP DATABASE`',
        );
        expect(escapeIfNeeded('prop} RETURN n //')).toBe('`prop} RETURN n //`');
      });
    });

    describe('idempotent behavior - already escaped', () => {
      it('returns already-escaped identifiers unchanged', () => {
        expect(escapeIfNeeded('`my-prop`')).toBe('`my-prop`');
        expect(escapeIfNeeded('`My Label`')).toBe('`My Label`');
        expect(escapeIfNeeded('`123abc`')).toBe('`123abc`');
      });

      it('does not double-escape internal backticks', () => {
        expect(escapeIfNeeded('`a``b`')).toBe('`a``b`');
        expect(escapeIfNeeded('`test``injection`')).toBe('`test``injection`');
      });

      it('is idempotent on repeated calls', () => {
        const original = 'my-prop';
        const escaped1 = escapeIfNeeded(original);
        const escaped2 = escapeIfNeeded(escaped1);
        const escaped3 = escapeIfNeeded(escaped2);

        expect(escaped1).toBe('`my-prop`');
        expect(escaped2).toBe('`my-prop`');
        expect(escaped3).toBe('`my-prop`');
      });
    });
  });

  describe('isAlreadyEscaped', () => {
    describe('properly escaped identifiers', () => {
      it('returns true for simple escaped names', () => {
        expect(isAlreadyEscaped('`Person`')).toBe(true);
        expect(isAlreadyEscaped('`name`')).toBe(true);
      });

      it('returns true for escaped names with spaces', () => {
        expect(isAlreadyEscaped('`My Label`')).toBe(true);
        expect(isAlreadyEscaped('`first name`')).toBe(true);
      });

      it('returns true for escaped names with doubled internal backticks', () => {
        expect(isAlreadyEscaped('`a``b`')).toBe(true);
        expect(isAlreadyEscaped('`test``injection`')).toBe(true);
        expect(isAlreadyEscaped('`a``b``c`')).toBe(true);
      });

      it('returns true for escaped empty string', () => {
        expect(isAlreadyEscaped('``')).toBe(true);
      });
    });

    describe('not properly escaped', () => {
      it('returns false for unescaped identifiers', () => {
        expect(isAlreadyEscaped('Person')).toBe(false);
        expect(isAlreadyEscaped('name')).toBe(false);
        expect(isAlreadyEscaped('My Label')).toBe(false);
      });

      it('returns false for incomplete escaping', () => {
        expect(isAlreadyEscaped('`incomplete')).toBe(false);
        expect(isAlreadyEscaped('incomplete`')).toBe(false);
      });

      it('returns false for improperly escaped internal backticks', () => {
        // Single internal backtick is not properly escaped
        expect(isAlreadyEscaped('`a`b`')).toBe(false);
        expect(isAlreadyEscaped('`test`injection`')).toBe(false);
      });

      it('returns false for empty string', () => {
        expect(isAlreadyEscaped('')).toBe(false);
      });
    });
  });

  describe('escapeLabelIfNeeded', () => {
    describe('raw valid labels - no escaping', () => {
      it('returns valid labels unchanged', () => {
        expect(escapeLabelIfNeeded('Person')).toBe('Person');
        expect(escapeLabelIfNeeded('User')).toBe('User');
        expect(escapeLabelIfNeeded('MyLabel')).toBe('MyLabel');
        expect(escapeLabelIfNeeded('Label_1')).toBe('Label_1');
      });
    });

    describe('raw invalid labels - escapes', () => {
      it('escapes labels with spaces', () => {
        expect(escapeLabelIfNeeded('My Label')).toBe('`My Label`');
        expect(escapeLabelIfNeeded('First Name')).toBe('`First Name`');
      });

      it('escapes labels starting with numbers', () => {
        expect(escapeLabelIfNeeded('123Label')).toBe('`123Label`');
      });

      it('escapes labels with special characters', () => {
        expect(escapeLabelIfNeeded('My-Label')).toBe('`My-Label`');
        expect(escapeLabelIfNeeded('Label!')).toBe('`Label!`');
      });

      it('escapes and doubles internal backticks', () => {
        expect(escapeLabelIfNeeded('Label`Injection')).toBe(
          '`Label``Injection`',
        );
      });
    });

    describe('pre-escaped labels - idempotent (no double-escaping)', () => {
      it('returns pre-escaped valid labels unchanged', () => {
        expect(escapeLabelIfNeeded('`Person`')).toBe('`Person`');
        expect(escapeLabelIfNeeded('`User`')).toBe('`User`');
      });

      it('returns pre-escaped labels with spaces unchanged', () => {
        expect(escapeLabelIfNeeded('`My Label`')).toBe('`My Label`');
        expect(escapeLabelIfNeeded('`First Name`')).toBe('`First Name`');
      });

      it('returns pre-escaped labels with doubled backticks unchanged', () => {
        expect(escapeLabelIfNeeded('`Label``Injection`')).toBe(
          '`Label``Injection`',
        );
      });
    });

    describe('integration with getLabel output', () => {
      // Simulates labels coming from model.getLabel() which always escapes
      it('handles labels that are already backtick-wrapped', () => {
        const fromGetLabel = '`Person`';
        expect(escapeLabelIfNeeded(fromGetLabel)).toBe('`Person`');
      });

      it('handles labels with spaces from getLabel', () => {
        const fromGetLabel = '`My Label`';
        expect(escapeLabelIfNeeded(fromGetLabel)).toBe('`My Label`');
      });

      it('handles multi-label strings joined by colon', () => {
        // getNormalizedLabels produces strings like `A`:`B` for multiple labels
        expect(escapeLabelIfNeeded('`A`:`B`')).toBe('`A`:`B`');
        expect(escapeLabelIfNeeded('`Person`:`User`')).toBe('`Person`:`User`');
      });

      it('handles multi-label strings with spaces', () => {
        expect(escapeLabelIfNeeded('`My Label`:`Other Label`')).toBe(
          '`My Label`:`Other Label`',
        );
      });

      it('handles multi-label strings joined by pipe', () => {
        // getNormalizedLabels with 'or' operation
        expect(escapeLabelIfNeeded('`A`|`B`')).toBe('`A`|`B`');
      });

      it('handles multi-label strings with escaped backticks', () => {
        expect(escapeLabelIfNeeded('`Label``One`:`Label``Two`')).toBe(
          '`Label``One`:`Label``Two`',
        );
      });

      it('handles three or more labels', () => {
        expect(escapeLabelIfNeeded('`A`:`B`:`C`')).toBe('`A`:`B`:`C`');
      });
    });
  });

  describe('assertValidCypherIdentifier', () => {
    describe('valid identifiers - no throw', () => {
      it('does not throw for valid names', () => {
        expect(() => assertValidCypherIdentifier('name', 'test')).not.toThrow();
        expect(() =>
          assertValidCypherIdentifier('first_name', 'test'),
        ).not.toThrow();
        expect(() =>
          assertValidCypherIdentifier('prop1', 'test'),
        ).not.toThrow();
        expect(() =>
          assertValidCypherIdentifier('_private', 'test'),
        ).not.toThrow();
      });
    });

    describe('invalid identifiers - throws', () => {
      it('throws NeogmaError for names starting with numbers', () => {
        expect(() =>
          assertValidCypherIdentifier('123abc', 'SET clause'),
        ).toThrow(NeogmaError);
        expect(() =>
          assertValidCypherIdentifier('123abc', 'SET clause'),
        ).toThrow(/Invalid identifier "123abc" in SET clause/);
      });

      it('throws NeogmaError for names with dashes', () => {
        expect(() =>
          assertValidCypherIdentifier('my-prop', 'ORDER BY clause'),
        ).toThrow(NeogmaError);
        expect(() =>
          assertValidCypherIdentifier('my-prop', 'ORDER BY clause'),
        ).toThrow(/Invalid identifier "my-prop" in ORDER BY clause/);
      });

      it('throws NeogmaError for names with spaces', () => {
        expect(() =>
          assertValidCypherIdentifier('my prop', 'WHERE clause'),
        ).toThrow(NeogmaError);
        expect(() =>
          assertValidCypherIdentifier('my prop', 'WHERE clause'),
        ).toThrow(/Invalid identifier "my prop" in WHERE clause/);
      });

      it('throws NeogmaError for injection attempts', () => {
        expect(() =>
          assertValidCypherIdentifier('name; DROP DATABASE', 'properties'),
        ).toThrow(NeogmaError);
        expect(() =>
          assertValidCypherIdentifier('name; DROP DATABASE', 'properties'),
        ).toThrow(/Invalid identifier "name; DROP DATABASE" in properties/);
      });

      it('includes helpful message about valid characters', () => {
        expect(() => assertValidCypherIdentifier('bad-name', 'test')).toThrow(
          /Identifiers must contain only alphanumeric characters and underscores/,
        );
        expect(() => assertValidCypherIdentifier('bad-name', 'test')).toThrow(
          /cannot start with a number/,
        );
      });

      it('throws for empty strings', () => {
        expect(() => assertValidCypherIdentifier('', 'test')).toThrow(
          NeogmaError,
        );
      });
    });
  });

  describe('sanitizeParamName', () => {
    it('returns valid names unchanged', () => {
      expect(sanitizeParamName('name')).toBe('name');
      expect(sanitizeParamName('first_name')).toBe('first_name');
      expect(sanitizeParamName('prop1')).toBe('prop1');
      expect(sanitizeParamName('_private')).toBe('_private');
    });

    it('replaces dashes with underscores', () => {
      expect(sanitizeParamName('my-prop')).toBe('my_prop');
      expect(sanitizeParamName('a-b-c')).toBe('a_b_c');
    });

    it('replaces spaces with underscores', () => {
      expect(sanitizeParamName('my prop')).toBe('my_prop');
      expect(sanitizeParamName('a b c')).toBe('a_b_c');
    });

    it('prepends underscore if starting with number', () => {
      expect(sanitizeParamName('123abc')).toBe('_123abc');
      expect(sanitizeParamName('1')).toBe('_1');
    });

    it('replaces special characters with underscores', () => {
      expect(sanitizeParamName('name; DELETE (n)')).toBe('name__DELETE__n_');
      expect(sanitizeParamName('prop`: injection')).toBe('prop___injection');
    });

    it('handles backticks', () => {
      expect(sanitizeParamName('`injection`')).toBe('_injection_');
    });

    it('returns param for empty strings', () => {
      expect(sanitizeParamName('')).toBe('param');
    });

    it('produces valid Cypher parameter names', () => {
      // All sanitized names should be valid identifiers
      const testCases = [
        'name',
        'my-prop',
        '123abc',
        'a b c',
        'name; DELETE',
        '`injection`',
      ];
      for (const testCase of testCases) {
        const sanitized = sanitizeParamName(testCase);
        expect(isValidCypherIdentifier(sanitized)).toBe(true);
      }
    });
  });
});
