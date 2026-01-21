import { getIdentifierWithLabel } from './getIdentifierWithLabel';
import { neogma } from '../testHelpers';

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

    it('handles label with spaces', () => {
      const result = getIdentifierWithLabel('n', 'My Label');
      expect(result).toBe('n:My Label');
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

  describe('type safety', () => {
    it('rejects number identifier', () => {
      // @ts-expect-error - identifier must be string or undefined, not number
      void getIdentifierWithLabel(123, 'Label');
    });

    it('rejects number label', () => {
      // @ts-expect-error - label must be string or undefined, not number
      void getIdentifierWithLabel('n', 123);
    });

    it('rejects object identifier', () => {
      // @ts-expect-error - identifier must be string or undefined, not object
      void getIdentifierWithLabel({ id: 'n' }, 'Label');
    });

    it('rejects array identifier', () => {
      // @ts-expect-error - identifier must be string or undefined, not array
      void getIdentifierWithLabel(['n'], 'Label');
    });

    it('rejects boolean identifier', () => {
      // @ts-expect-error - identifier must be string or undefined, not boolean
      void getIdentifierWithLabel(true, 'Label');
    });

    it('rejects null identifier', () => {
      // @ts-expect-error - identifier must be string or undefined, not null
      void getIdentifierWithLabel(null, 'Label');
    });
  });
});
