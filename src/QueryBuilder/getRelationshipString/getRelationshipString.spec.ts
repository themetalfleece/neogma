import { BindParam } from '../../BindParam';
import { Op } from '../../Where';
import { neogma } from '../testHelpers';
import { getRelationshipString } from './getRelationshipString';

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
      expect(result.statement).toBe('-[:KNOWS]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('handles empty string', () => {
      const deps = createDeps();
      const result = getRelationshipString('', deps);
      expect(result.statement).toBe('');
      expect(result.standaloneWhere).toBeNull();
    });

    it('handles complex string patterns', () => {
      const deps = createDeps();
      const result = getRelationshipString('-[r:KNOWS {since: 2020}]->', deps);
      expect(result.statement).toBe('-[r:KNOWS {since: 2020}]->');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('direction out', () => {
    it('generates outgoing relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS' },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates outgoing relationship with identifier and name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', identifier: 'r', name: 'KNOWS' },
        deps,
      );
      expect(result.statement).toBe('-[r:KNOWS]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates outgoing relationship with identifier only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', identifier: 'r' },
        deps,
      );
      expect(result.statement).toBe('-[r]->');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('direction in', () => {
    it('generates incoming relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'in', name: 'KNOWS' },
        deps,
      );
      expect(result.statement).toBe('<-[:KNOWS]-');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates incoming relationship with identifier and name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'in', identifier: 'r', name: 'CREATED_BY' },
        deps,
      );
      expect(result.statement).toBe('<-[r:CREATED_BY]-');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('direction none', () => {
    it('generates undirected relationship with name', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'none', name: 'RELATED_TO' },
        deps,
      );
      expect(result.statement).toBe('-[:RELATED_TO]-');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates undirected relationship with identifier', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'none', identifier: 'rel' },
        deps,
      );
      expect(result.statement).toBe('-[rel]-');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('variable length relationships', () => {
    it('generates relationship with minHops only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 2 },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS*2..]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates relationship with maxHops only', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', maxHops: 5 },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS*..5]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates relationship with both minHops and maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 1, maxHops: 3 },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS*1..3]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates relationship with equal minHops and maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', minHops: 2, maxHops: 2 },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS*2]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates relationship with Infinity maxHops', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', name: 'KNOWS', maxHops: Infinity },
        deps,
      );
      expect(result.statement).toBe('-[:KNOWS*]->');
      expect(result.standaloneWhere).toBeNull();
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
      expect(result.statement).toBe('-[r:KNOWS { since: $since }]->');
      expect(result.standaloneWhere).toBeNull();
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
      expect(result.statement).toContain('[:WORKS_AT {');
      expect(result.standaloneWhere).toBeNull();
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
      expect(result.statement).toContain('[:KNOWS {');
      expect(result.standaloneWhere).toBeNull();
      expect(deps.bindParam.get()).toEqual({ since: 2020 });
    });
  });

  describe('empty/minimal input', () => {
    it('generates minimal relationship for direction only', () => {
      const deps = createDeps();
      const result = getRelationshipString({ direction: 'out' }, deps);
      expect(result.statement).toBe('-[]->');
      expect(result.standaloneWhere).toBeNull();
    });

    it('generates minimal incoming relationship', () => {
      const deps = createDeps();
      const result = getRelationshipString({ direction: 'in' }, deps);
      expect(result.statement).toBe('<-[]-');
      expect(result.standaloneWhere).toBeNull();
    });
  });

  describe('non-eq operators', () => {
    it('returns standaloneWhere for non-eq operators', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          identifier: 'r',
          where: { since: { [Op.gte]: 2020 } },
        },
        deps,
      );
      expect(result.statement).toBe('-[r:KNOWS]->');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe(
        'r.since >= $since',
      );
    });

    it('splits eq and non-eq operators', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          identifier: 'r',
          where: { type: 'friend', since: { [Op.gte]: 2020 } },
        },
        deps,
      );
      expect(result.statement).toBe('-[r:KNOWS { type: $type }]->');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe(
        'r.since >= $since',
      );
      expect(deps.bindParam.get()).toEqual({ type: 'friend', since: 2020 });
    });

    it('generates unique identifier for non-eq without identifier', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          where: { since: { [Op.gte]: 2020 } },
        },
        deps,
      );
      // Should generate identifier __r
      expect(result.statement).toBe('-[__r:KNOWS]->');
      expect(result.standaloneWhere).not.toBeNull();
      expect(result.standaloneWhere?.getStatement('text')).toBe(
        '__r.since >= $since',
      );
    });

    it('uses shared BindParam for auto-generated identifier', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        {
          direction: 'out',
          name: 'KNOWS',
          where: { since: { [Op.gte]: 2020 } },
        },
        deps,
      );

      // The since value should be in the shared bindParam
      expect(deps.bindParam.get()).toEqual({ since: 2020 });

      // The generated identifier should use the bindParam's getUniqueName
      expect(result.statement).toBe('-[__r:KNOWS]->');
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
      const _typeCheck = () => {
        const deps = createDeps();
        // @ts-expect-error - identifier must be string, not number
        getRelationshipString({ direction: 'out', identifier: 123 }, deps);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects invalid name type', () => {
      const _typeCheck = () => {
        const deps = createDeps();
        // @ts-expect-error - name must be string, not number
        getRelationshipString({ direction: 'out', name: 123 }, deps);
      };
      expect(_typeCheck).toBeDefined();
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

    it('ignores where when invalid type passed', () => {
      const deps = createDeps();
      const result = getRelationshipString(
        { direction: 'out', where: 'invalid' as any },
        deps,
      );
      // The string is not treated as an object - it's ignored entirely
      expect(result.statement).toBe('-[]->');
    });
  });
});
