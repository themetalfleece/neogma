import { neogma } from '../testHelpers';
import { getVariableLengthRelationshipString } from './getVariableLengthRelationshipString';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getVariableLengthRelationshipString', () => {
  describe('no hops specified', () => {
    it('returns null when no hops provided', () => {
      const result = getVariableLengthRelationshipString({});
      expect(result).toBeNull();
    });

    it('returns null for empty object', () => {
      const result = getVariableLengthRelationshipString({
        minHops: undefined,
        maxHops: undefined,
      });
      expect(result).toBeNull();
    });
  });

  describe('minHops only', () => {
    it('generates *m.. pattern for minHops', () => {
      const result = getVariableLengthRelationshipString({ minHops: 2 });
      expect(result).toBe('*2..');
    });

    it('handles minHops of 0', () => {
      const result = getVariableLengthRelationshipString({ minHops: 0 });
      expect(result).toBe('*0..');
    });

    it('handles minHops of 1', () => {
      const result = getVariableLengthRelationshipString({ minHops: 1 });
      expect(result).toBe('*1..');
    });

    it('handles large minHops', () => {
      const result = getVariableLengthRelationshipString({ minHops: 100 });
      expect(result).toBe('*100..');
    });
  });

  describe('maxHops only', () => {
    it('generates *..n pattern for maxHops', () => {
      const result = getVariableLengthRelationshipString({ maxHops: 5 });
      expect(result).toBe('*..5');
    });

    it('handles maxHops of 0', () => {
      const result = getVariableLengthRelationshipString({ maxHops: 0 });
      expect(result).toBe('*..0');
    });

    it('handles maxHops of 1', () => {
      const result = getVariableLengthRelationshipString({ maxHops: 1 });
      expect(result).toBe('*..1');
    });

    it('handles large maxHops', () => {
      const result = getVariableLengthRelationshipString({ maxHops: 100 });
      expect(result).toBe('*..100');
    });
  });

  describe('both minHops and maxHops', () => {
    it('generates *m..n pattern', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 2,
        maxHops: 5,
      });
      expect(result).toBe('*2..5');
    });

    it('handles minHops of 0 with maxHops', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 0,
        maxHops: 3,
      });
      expect(result).toBe('*0..3');
    });

    it('handles minHops of 1 with maxHops of 1', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 1,
        maxHops: 1,
      });
      expect(result).toBe('*1');
    });

    it('generates *m pattern when minHops equals maxHops', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 3,
        maxHops: 3,
      });
      expect(result).toBe('*3');
    });

    it('handles equal 0 hops', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 0,
        maxHops: 0,
      });
      expect(result).toBe('*0');
    });
  });

  describe('infinity', () => {
    it('returns * for maxHops Infinity', () => {
      const result = getVariableLengthRelationshipString({
        maxHops: Infinity,
      });
      expect(result).toBe('*');
    });

    it('returns * for minHops Infinity', () => {
      const result = getVariableLengthRelationshipString({
        minHops: Infinity,
      });
      expect(result).toBe('*');
    });

    it('returns * when both are Infinity', () => {
      const result = getVariableLengthRelationshipString({
        minHops: Infinity,
        maxHops: Infinity,
      });
      expect(result).toBe('*');
    });

    it('returns * when minHops is number and maxHops is Infinity', () => {
      const result = getVariableLengthRelationshipString({
        minHops: 2,
        maxHops: Infinity,
      });
      expect(result).toBe('*');
    });
  });

  describe('type safety', () => {
    it('rejects string minHops', () => {
      // @ts-expect-error - minHops must be number, not string
      void getVariableLengthRelationshipString({ minHops: '2' });
    });

    it('rejects string maxHops', () => {
      // @ts-expect-error - maxHops must be number, not string
      void getVariableLengthRelationshipString({ maxHops: '5' });
    });

    it('rejects boolean minHops', () => {
      // @ts-expect-error - minHops must be number, not boolean
      void getVariableLengthRelationshipString({ minHops: true });
    });

    it('rejects null minHops', () => {
      // @ts-expect-error - minHops must be number or undefined, not null
      void getVariableLengthRelationshipString({ minHops: null });
    });

    it('rejects object minHops', () => {
      // @ts-expect-error - minHops must be number, not object
      void getVariableLengthRelationshipString({ minHops: { value: 2 } });
    });

    it('rejects array minHops', () => {
      // @ts-expect-error - minHops must be number, not array
      void getVariableLengthRelationshipString({ minHops: [2] });
    });
  });
});
