import { BindParam } from '../../BindParam';
import { Where } from '../../Where';
import { neogma } from '../testHelpers';
import { getRelationshipStatement } from './getRelationshipStatement';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getRelationshipStatement', () => {
  describe('direction', () => {
    it('generates outgoing relationship', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
      });
      expect(result).toBe('-[:KNOWS]->');
    });

    it('generates incoming relationship', () => {
      const result = getRelationshipStatement({
        direction: 'in',
        name: 'KNOWS',
      });
      expect(result).toBe('<-[:KNOWS]-');
    });

    it('generates undirected relationship', () => {
      const result = getRelationshipStatement({
        direction: 'none',
        name: 'KNOWS',
      });
      expect(result).toBe('-[:KNOWS]-');
    });
  });

  describe('identifier', () => {
    it('includes identifier when provided', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
      });
      expect(result).toBe('-[r:KNOWS]->');
    });

    it('handles identifier without name', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        identifier: 'r',
      });
      expect(result).toBe('-[r]->');
    });

    it('handles empty identifier', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: '',
      });
      expect(result).toBe('-[:KNOWS]->');
    });
  });

  describe('variable length relationships', () => {
    it('handles minHops only', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        minHops: 2,
      });
      expect(result).toBe('-[:KNOWS*2..]->');
    });

    it('handles maxHops only', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        maxHops: 5,
      });
      expect(result).toBe('-[:KNOWS*..5]->');
    });

    it('handles both minHops and maxHops', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        minHops: 2,
        maxHops: 5,
      });
      expect(result).toBe('-[:KNOWS*2..5]->');
    });

    it('handles equal minHops and maxHops', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        minHops: 3,
        maxHops: 3,
      });
      expect(result).toBe('-[:KNOWS*3]->');
    });

    it('handles Infinity maxHops', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        maxHops: Infinity,
      });
      expect(result).toBe('-[:KNOWS*]->');
    });

    it('handles minHops of 0', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        minHops: 0,
        maxHops: 3,
      });
      expect(result).toBe('-[:KNOWS*0..3]->');
    });

    it('handles variable length with identifier', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
        minHops: 1,
        maxHops: 5,
      });
      expect(result).toBe('-[r:KNOWS*1..5]->');
    });
  });

  describe('inner string', () => {
    it('handles inner string parameter', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        inner: '{ since: $since }',
      });
      expect(result).toBe('-[:KNOWS { since: $since }]->');
    });

    it('handles inner string with identifier', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
        inner: '{ weight: 1 }',
      });
      expect(result).toBe('-[r:KNOWS { weight: 1 }]->');
    });
  });

  describe('inner Where instance', () => {
    it('handles Where instance as inner', () => {
      const bindParam = new BindParam();
      const where = new Where({ r: { since: 2020 } }, bindParam);
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        inner: where,
      });
      expect(result).toContain('KNOWS');
      expect(result).toContain('since: $since');
    });

    it('handles complex Where with identifier', () => {
      const bindParam = new BindParam();
      const where = new Where({ r: { since: 2020, strength: 5 } }, bindParam);
      const result = getRelationshipStatement({
        direction: 'in',
        name: 'FOLLOWS',
        identifier: 'rel',
        inner: where,
      });
      expect(result).toContain('rel:FOLLOWS');
      expect(result).toContain('since: $since');
      expect(result).toContain('strength: $strength');
    });
  });

  describe('inner properties with bindParam', () => {
    it('handles properties object with bindParam', () => {
      const bindParam = new BindParam();
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
        inner: {
          properties: { since: 2020, active: true },
          bindParam,
        },
      });
      expect(result).toContain('r:KNOWS');
      expect(result).toContain('since: $since');
      expect(result).toContain('active: $active');
      expect(bindParam.get()).toEqual({ since: 2020, active: true });
    });
  });

  describe('combinations', () => {
    it('handles all options together', () => {
      const bindParam = new BindParam();
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'KNOWS',
        identifier: 'r',
        minHops: 1,
        maxHops: 3,
        inner: {
          properties: { weight: 1 },
          bindParam,
        },
      });
      expect(result).toContain('r:KNOWS');
      expect(result).toContain('*1..3');
      expect(result).toContain('weight: $weight');
    });

    it('handles minimal params (direction only)', () => {
      const result = getRelationshipStatement({
        direction: 'out',
      });
      expect(result).toBe('-[]->');
    });

    it('handles variable length without name', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        identifier: 'r',
        minHops: 1,
        maxHops: 5,
      });
      expect(result).toBe('-[r*1..5]->');
    });
  });

  describe('edge cases', () => {
    it('handles long relationship name', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'VERY_LONG_RELATIONSHIP_NAME',
      });
      expect(result).toBe('-[:VERY_LONG_RELATIONSHIP_NAME]->');
    });

    it('handles identifier with underscore', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'REL',
        identifier: 'my_rel',
      });
      expect(result).toBe('-[my_rel:REL]->');
    });

    it('handles identifier with numbers', () => {
      const result = getRelationshipStatement({
        direction: 'out',
        name: 'REL',
        identifier: 'rel1',
      });
      expect(result).toBe('-[rel1:REL]->');
    });
  });

  describe('type safety', () => {
    it('rejects invalid direction', () => {
      void getRelationshipStatement({
        // @ts-expect-error - direction must be 'in', 'out', or 'none'
        direction: 'invalid',
        name: 'KNOWS',
      });
    });

    it('rejects number direction', () => {
      void getRelationshipStatement({
        // @ts-expect-error - direction must be string 'in', 'out', or 'none'
        direction: 1,
        name: 'KNOWS',
      });
    });

    it('rejects number identifier', () => {
      const _typeCheck = () => {
        getRelationshipStatement({
          direction: 'out',
          // @ts-expect-error - identifier must be string or undefined
          identifier: 123,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects number name', () => {
      const _typeCheck = () => {
        getRelationshipStatement({
          direction: 'out',
          // @ts-expect-error - name must be string or undefined
          name: 456,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects string minHops', () => {
      void getRelationshipStatement({
        direction: 'out',
        // @ts-expect-error - minHops must be number or undefined
        minHops: '2',
      });
    });

    it('rejects string maxHops', () => {
      void getRelationshipStatement({
        direction: 'out',
        // @ts-expect-error - maxHops must be number or undefined
        maxHops: '5',
      });
    });

    it('rejects number inner', () => {
      const _typeCheck = () => {
        getRelationshipStatement({
          direction: 'out',
          // @ts-expect-error - inner must be string, Where, or properties object
          inner: 123,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing direction', () => {
      const _typeCheck = () => {
        // @ts-expect-error - direction is required
        getRelationshipStatement({ name: 'KNOWS' });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
