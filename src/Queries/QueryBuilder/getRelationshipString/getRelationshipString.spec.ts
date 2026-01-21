import { BindParam } from '../../BindParam';
import { getRelationshipString } from './getRelationshipString';
import { neogma } from '../testHelpers';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getRelationshipString', () => {
  const createDeps = () => {
    const bindParam = new BindParam();
    return {
      bindParam,
      getBindParam: () => bindParam,
    };
  };

  describe('string input', () => {
    it('returns the string as-is when relationship is a string', () => {
      const deps = createDeps();
      const result = getRelationshipString('-[:KNOWS]->', deps);
      expect(result).toBe('-[:KNOWS]->');
    });

    it('handles empty string', () => {
      const deps = createDeps();
      const result = getRelationshipString('', deps);
      expect(result).toBe('');
    });

    it('handles complex string patterns', () => {
      const deps = createDeps();
      const result = getRelationshipString('-[r:KNOWS {since: 2020}]->', deps);
      expect(result).toBe('-[r:KNOWS {since: 2020}]->');
    });
  });

  describe('direction out', () => {
    it('generates outgoing relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS' },
        deps,
      );
      expect(result).toBe('-[:KNOWS]->');
    });

    it('generates outgoing relationship with identifier and name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', identifier: 'r', name: 'KNOWS' },
        deps,
      );
      expect(result).toBe('-[r:KNOWS]->');
    });

    it('generates outgoing relationship with identifier only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', identifier: 'r' },
        deps,
      );
      expect(result).toBe('-[r]->');
    });
  });

  describe('direction in', () => {
    it('generates incoming relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'in', name: 'KNOWS' },
        deps,
      );
      expect(result).toBe('<-[:KNOWS]-');
    });

    it('generates incoming relationship with identifier and name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'in', identifier: 'r', name: 'CREATED_BY' },
        deps,
      );
      expect(result).toBe('<-[r:CREATED_BY]-');
    });
  });

  describe('direction none', () => {
    it('generates undirected relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'none', name: 'RELATED_TO' },
        deps,
      );
      expect(result).toBe('-[:RELATED_TO]-');
    });

    it('generates undirected relationship with identifier', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'none', identifier: 'rel' },
        deps,
      );
      expect(result).toBe('-[rel]-');
    });
  });

  describe('variable length relationships', () => {
    it('generates relationship with minHops only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 2 },
        deps,
      );
      expect(result).toBe('-[:KNOWS*2..]->');
    });

    it('generates relationship with maxHops only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', maxHops: 5 },
        deps,
      );
      expect(result).toBe('-[:KNOWS*..5]->');
    });

    it('generates relationship with both minHops and maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 1, maxHops: 3 },
        deps,
      );
      expect(result).toBe('-[:KNOWS*1..3]->');
    });

    it('generates relationship with equal minHops and maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 2, maxHops: 2 },
        deps,
      );
      expect(result).toBe('-[:KNOWS*2]->');
    });

    it('generates relationship with Infinity maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', maxHops: Infinity },
        deps,
      );
      expect(result).toBe('-[:KNOWS*]->');
    });
  });

  describe('with where clause', () => {
    it('generates relationship with where properties', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          identifier: 'r',
          where: { since: 2020 },
        },
        deps,
      );
      expect(result).toBe('-[r:KNOWS { since: $since }]->');
      expect(deps.bindParam.get()).toEqual({ since: 2020 });
    });

    it('generates relationship with multiple where properties', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'WORKS_AT',
          where: { role: 'Developer', active: true },
        },
        deps,
      );
      expect(result).toContain('[:WORKS_AT {');
      expect(deps.bindParam.get()).toEqual({ role: 'Developer', active: true });
    });
  });

  describe('with properties', () => {
    it('generates relationship with properties', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          properties: { since: 2020 },
        },
        deps,
      );
      expect(result).toContain('[:KNOWS {');
      expect(deps.bindParam.get()).toEqual({ since: 2020 });
    });
  });

  describe('empty/minimal input', () => {
    it('generates minimal relationship for direction only', () => {
      const deps = createDeps();
      const result = getRelationshipString({ direction: 'out' }, deps);
      expect(result).toBe('-[]->');
    });

    it('generates minimal incoming relationship', () => {
      const deps = createDeps();
      const result = getRelationshipString({ direction: 'in' }, deps);
      expect(result).toBe('<-[]-');
    });
  });

  describe('type safety', () => {
    it('rejects invalid relationship type', () => {
      const deps = createDeps();
      // @ts-expect-error - relationship must be string or object, not number
      void getRelationshipString(123, deps);
    });

    it('rejects invalid direction', () => {
      const deps = createDeps();
      // @ts-expect-error - direction must be 'in', 'out', or 'none'
      void getRelationshipString({ direction: 'invalid' }, deps);
    });

    it('rejects invalid identifier type', () => {
      const deps = createDeps();
      // @ts-expect-error - identifier must be string, not number
      void getRelationshipString({ direction: 'out', identifier: 123 }, deps);
    });

    it('rejects invalid name type', () => {
      const deps = createDeps();
      // @ts-expect-error - name must be string, not number
      void getRelationshipString({ direction: 'out', name: 123 }, deps);
    });

    it('rejects invalid minHops type', () => {
      const deps = createDeps();
      // @ts-expect-error - minHops must be number, not string
      void getRelationshipString({ direction: 'out', minHops: '2' }, deps);
    });

    it('rejects invalid maxHops type', () => {
      const deps = createDeps();
      // @ts-expect-error - maxHops must be number, not string
      void getRelationshipString({ direction: 'out', maxHops: '5' }, deps);
    });

    it('rejects invalid where type', () => {
      const deps = createDeps();
      // @ts-expect-error - where must be object, not string
      void getRelationshipString({ direction: 'out', where: 'invalid' }, deps);
    });
  });
});
