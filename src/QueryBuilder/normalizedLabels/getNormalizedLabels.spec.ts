import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { neogma } from '../testHelpers';
import { getNormalizedLabels } from './getNormalizedLabels';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getNormalizedLabels', () => {
  describe('single label', () => {
    it('wraps single label in backticks', () => {
      const result = getNormalizedLabels('MyLabel');
      expect(result).toBe('`MyLabel`');
    });

    it('handles label with spaces', () => {
      const result = getNormalizedLabels('My Label');
      expect(result).toBe('`My Label`');
    });

    it('handles label with special characters', () => {
      const result = getNormalizedLabels('Label-With-Dashes');
      expect(result).toBe('`Label-With-Dashes`');
    });

    it('throws for empty string label', () => {
      expect(() => getNormalizedLabels('')).toThrow(NeogmaConstraintError);
      expect(() => getNormalizedLabels('')).toThrow(
        'label cannot be empty or whitespace-only',
      );
    });

    it('throws for whitespace-only label', () => {
      expect(() => getNormalizedLabels('   ')).toThrow(NeogmaConstraintError);
    });

    it('handles label with numbers', () => {
      const result = getNormalizedLabels('Label123');
      expect(result).toBe('`Label123`');
    });

    it('handles label with underscores', () => {
      const result = getNormalizedLabels('My_Label');
      expect(result).toBe('`My_Label`');
    });
  });

  describe('multiple labels with AND operation (default)', () => {
    it('joins multiple labels with colon', () => {
      const result = getNormalizedLabels(['Label1', 'Label2']);
      expect(result).toBe('`Label1`:`Label2`');
    });

    it('handles three labels', () => {
      const result = getNormalizedLabels(['A', 'B', 'C']);
      expect(result).toBe('`A`:`B`:`C`');
    });

    it('handles single label in array', () => {
      const result = getNormalizedLabels(['SingleLabel']);
      expect(result).toBe('`SingleLabel`');
    });

    it('handles empty array', () => {
      const result = getNormalizedLabels([]);
      expect(result).toBe('');
    });

    it('explicitly passes and operation', () => {
      const result = getNormalizedLabels(['Label1', 'Label2'], 'and');
      expect(result).toBe('`Label1`:`Label2`');
    });
  });

  describe('multiple labels with OR operation', () => {
    it('joins multiple labels with pipe', () => {
      const result = getNormalizedLabels(['Label1', 'Label2'], 'or');
      expect(result).toBe('`Label1`|`Label2`');
    });

    it('handles three labels with or', () => {
      const result = getNormalizedLabels(['A', 'B', 'C'], 'or');
      expect(result).toBe('`A`|`B`|`C`');
    });

    it('handles single label with or operation', () => {
      const result = getNormalizedLabels(['Single'], 'or');
      expect(result).toBe('`Single`');
    });
  });

  describe('edge cases', () => {
    it('escapes internal backticks by doubling them', () => {
      const result = getNormalizedLabels('`Already`');
      // Internal backticks are doubled, then wrapped in outer backticks
      expect(result).toBe('```Already```');
    });

    it('escapes single internal backtick', () => {
      const result = getNormalizedLabels('Label`Injection');
      expect(result).toBe('`Label``Injection`');
    });

    it('prevents backtick injection attacks', () => {
      // Attempt to break out of backtick quoting
      const result = getNormalizedLabels('Evil`; DELETE (n); //');
      // Internal backtick is doubled, preventing breakout
      expect(result).toBe('`Evil``; DELETE (n); //`');
    });

    it('handles unicode characters', () => {
      const result = getNormalizedLabels('日本語');
      expect(result).toBe('`日本語`');
    });

    it('handles labels with colons', () => {
      const result = getNormalizedLabels('Label:With:Colons');
      expect(result).toBe('`Label:With:Colons`');
    });
  });

  describe('validation', () => {
    it('throws for null parameter', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(null)).toThrow(NeogmaConstraintError);
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(null)).toThrow('got null');
    });

    it('throws for undefined parameter', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(undefined)).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(undefined)).toThrow('got undefined');
    });

    it('throws for null in array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(['Valid', null])).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels(['Valid', null])).toThrow('at index 1');
    });

    it('throws for empty string in array', () => {
      expect(() => getNormalizedLabels(['Valid', ''])).toThrow(
        NeogmaConstraintError,
      );
      expect(() => getNormalizedLabels(['Valid', ''])).toThrow(
        'label cannot be empty',
      );
    });

    it('throws for number in array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels([123, 'Label'])).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => getNormalizedLabels([123, 'Label'])).toThrow(
        'expected a string, got number',
      );
    });
  });

  describe('type safety', () => {
    it('rejects number parameter at compile and runtime', () => {
      expect(() =>
        // @ts-expect-error - label must be string or string[], not number
        getNormalizedLabels(123),
      ).toThrow(NeogmaConstraintError);
    });

    it('rejects object parameter at compile and runtime', () => {
      expect(() =>
        // @ts-expect-error - label must be string or string[], not object
        getNormalizedLabels({ label: 'test' }),
      ).toThrow(NeogmaConstraintError);
    });

    it('rejects boolean parameter at compile and runtime', () => {
      expect(() =>
        // @ts-expect-error - label must be string or string[], not boolean
        getNormalizedLabels(true),
      ).toThrow(NeogmaConstraintError);
    });

    it('rejects invalid operation at compile time', () => {
      // @ts-expect-error - operation must be 'and' or 'or', not 'invalid'
      void getNormalizedLabels(['Label1', 'Label2'], 'invalid');
    });
  });
});
