import { QueryBuilder } from './QueryBuilder';
import { neogma } from './testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('QueryBuilder static methods', () => {
  describe('getNormalizedLabels', () => {
    it('accepts string', () => {
      const result = QueryBuilder.getNormalizedLabels('MyLabel');
      expect(result).toBe('`MyLabel`');
    });

    it('accepts string array', () => {
      const result = QueryBuilder.getNormalizedLabels(['Label1', 'Label2']);
      expect(result).toBe('`Label1`:`Label2`');
    });

    it('accepts string array with or operation', () => {
      const result = QueryBuilder.getNormalizedLabels(
        ['Label1', 'Label2'],
        'or',
      );
      expect(result).toBe('`Label1`|`Label2`');
    });

    it('rejects invalid parameter type', () => {
      // @ts-expect-error - getNormalizedLabels requires string or string[], not number
      void QueryBuilder.getNormalizedLabels(123);
    });
  });

  describe('getIdentifierWithLabel', () => {
    it('accepts string parameters', () => {
      const result = QueryBuilder.getIdentifierWithLabel('n', 'MyLabel');
      expect(result).toBe('n:MyLabel');
    });

    it('handles undefined identifier', () => {
      const result = QueryBuilder.getIdentifierWithLabel(undefined, 'MyLabel');
      expect(result).toBe(':MyLabel');
    });

    it('handles undefined label', () => {
      const result = QueryBuilder.getIdentifierWithLabel('n', undefined);
      expect(result).toBe('n');
    });

    it('handles both undefined', () => {
      const result = QueryBuilder.getIdentifierWithLabel(undefined, undefined);
      expect(result).toBe('');
    });
  });

  describe('getNodeStatement', () => {
    it('accepts valid parameters', () => {
      const result = QueryBuilder.getNodeStatement({
        identifier: 'n',
        label: 'MyLabel',
      });
      expect(result).toBe('(n:MyLabel)');
    });

    it('handles only identifier', () => {
      const result = QueryBuilder.getNodeStatement({
        identifier: 'n',
      });
      expect(result).toBe('(n)');
    });

    it('handles only label', () => {
      const result = QueryBuilder.getNodeStatement({
        label: 'MyLabel',
      });
      expect(result).toBe('(:MyLabel)');
    });

    it('handles empty params', () => {
      const result = QueryBuilder.getNodeStatement({});
      expect(result).toBe('()');
    });
  });

  describe('getRelationshipStatement', () => {
    it('accepts valid parameters', () => {
      const result = QueryBuilder.getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
      });
      expect(result).toBe('-[r:KNOWS]->');
    });

    it('handles direction in', () => {
      const result = QueryBuilder.getRelationshipStatement({
        direction: 'in',
        name: 'KNOWS',
      });
      expect(result).toBe('<-[:KNOWS]-');
    });

    it('handles direction none', () => {
      const result = QueryBuilder.getRelationshipStatement({
        direction: 'none',
        name: 'KNOWS',
      });
      expect(result).toBe('-[:KNOWS]-');
    });

    it('rejects invalid direction', () => {
      void QueryBuilder.getRelationshipStatement({
        // @ts-expect-error - direction must be 'in', 'out', or 'none'
        direction: 'invalid',
        name: 'KNOWS',
      });
    });
  });

  describe('getVariableLengthRelationshipString', () => {
    it('returns null when no hops specified', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({});
      expect(result).toBeNull();
    });

    it('handles only minHops', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({
        minHops: 2,
      });
      expect(result).toBe('*2..');
    });

    it('handles only maxHops', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({
        maxHops: 5,
      });
      expect(result).toBe('*..5');
    });

    it('handles both minHops and maxHops', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({
        minHops: 2,
        maxHops: 5,
      });
      expect(result).toBe('*2..5');
    });

    it('handles equal minHops and maxHops', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({
        minHops: 3,
        maxHops: 3,
      });
      expect(result).toBe('*3');
    });

    it('handles Infinity', () => {
      const result = QueryBuilder.getVariableLengthRelationshipString({
        maxHops: Infinity,
      });
      expect(result).toBe('*');
    });
  });

  describe('getSetParts', () => {
    it('returns empty for empty data', () => {
      const { BindParam } = require('../BindParam');
      const bindParam = new BindParam();
      const result = QueryBuilder.getSetParts({
        data: {},
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toEqual([]);
      expect(result.statement).toBe('');
    });

    it('generates set parts for data', () => {
      const { BindParam } = require('../BindParam');
      const bindParam = new BindParam();
      const result = QueryBuilder.getSetParts({
        data: { name: 'test', age: 25 },
        identifier: 'n',
        bindParam,
      });
      expect(result.parts).toHaveLength(2);
      expect(result.statement).toContain('SET');
    });
  });

  describe('getPropertiesWithParams', () => {
    it('generates properties with params', () => {
      const { BindParam } = require('../BindParam');
      const bindParam = new BindParam();
      const result = QueryBuilder.getPropertiesWithParams(
        { name: 'test', age: 25 },
        bindParam,
      );
      expect(result).toContain('name:');
      expect(result).toContain('age:');
      expect(result.startsWith('{')).toBe(true);
      expect(result.endsWith('}')).toBe(true);
    });
  });
});
