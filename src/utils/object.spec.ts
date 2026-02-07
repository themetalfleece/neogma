import { isEmptyObject, isPlainObject } from './object';

describe('object utilities', () => {
  describe('isEmptyObject', () => {
    it('returns true for empty object', () => {
      expect(isEmptyObject({})).toBe(true);
    });

    it('returns false for object with properties', () => {
      expect(isEmptyObject({ a: 1 })).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('returns true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
    });

    it('returns true for null-prototype objects', () => {
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('returns false for non-objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });
  });
});
