import { getNormalizedLabels } from './getNormalizedLabels';
import { neogma } from '../testHelpers';

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

    it('handles empty string label', () => {
      const result = getNormalizedLabels('');
      expect(result).toBe('``');
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
    it('handles labels with backticks already', () => {
      const result = getNormalizedLabels('`Already`');
      expect(result).toBe('``Already``');
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

  describe('type safety', () => {
    it('rejects number parameter', () => {
      // @ts-expect-error - label must be string or string[], not number
      void getNormalizedLabels(123);
    });

    it('rejects object parameter', () => {
      // @ts-expect-error - label must be string or string[], not object
      void getNormalizedLabels({ label: 'test' });
    });

    it('rejects boolean parameter', () => {
      // @ts-expect-error - label must be string or string[], not boolean
      void getNormalizedLabels(true);
    });

    it('rejects null parameter', () => {
      // @ts-expect-error - label must be string or string[], not null
      void getNormalizedLabels(null);
    });

    it('rejects invalid operation', () => {
      // @ts-expect-error - operation must be 'and' or 'or', not 'invalid'
      void getNormalizedLabels(['Label1', 'Label2'], 'invalid');
    });

    it('rejects number in array', () => {
      // @ts-expect-error - array elements must be strings, not numbers
      void getNormalizedLabels([123, 'Label']);
    });
  });
});
