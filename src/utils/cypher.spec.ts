import { NeogmaError } from '../Errors';
import {
  assertValidCypherIdentifier,
  escapeCypherIdentifier,
  escapeIfNeeded,
  isValidCypherIdentifier,
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
});
