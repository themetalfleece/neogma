import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';
import { getOnMatchSetString } from './getOnMatchSetString';
import { isOnMatchSetObject } from './getOnMatchSetString.types';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getOnMatchSetString', () => {
  describe('with literal string', () => {
    it('generates ON MATCH SET statement by a literal string', () => {
      const literal = 'n.accessCount = n.accessCount + 1';
      const queryBuilder = new QueryBuilder().onMatchSet(literal);

      expectStatementEquals(queryBuilder, `ON MATCH SET ${literal}`);
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates ON MATCH SET with complex literal expression', () => {
      const literal =
        'n.lastAccessed = timestamp(), n.accessCount = n.accessCount + 1';
      const queryBuilder = new QueryBuilder().onMatchSet(literal);

      expectStatementEquals(queryBuilder, `ON MATCH SET ${literal}`);
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('with object', () => {
    it('generates ON MATCH SET statement with identifier and properties', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          lastAccessed: '2024-01-01',
          status: 'active',
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.lastAccessed = $lastAccessed, n.status = $status',
      );
      expectBindParamEquals(queryBuilder, {
        lastAccessed: '2024-01-01',
        status: 'active',
      });
    });

    it('generates ON MATCH SET with single property', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'person',
        properties: {
          updatedAt: '2024-01-01T12:00:00Z',
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET person.updatedAt = $updatedAt',
      );
      expectBindParamEquals(queryBuilder, {
        updatedAt: '2024-01-01T12:00:00Z',
      });
    });

    it('generates ON MATCH SET with numeric values', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          accessCount: 5,
          version: 2,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.accessCount = $accessCount, n.version = $version',
      );
      expectBindParamEquals(queryBuilder, { accessCount: 5, version: 2 });
    });

    it('generates ON MATCH SET with boolean values', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          isNew: false,
          isActive: true,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.isNew = $isNew, n.isActive = $isActive',
      );
      expectBindParamEquals(queryBuilder, { isNew: false, isActive: true });
    });

    it('returns empty string when properties object is empty', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {},
      });

      expectStatementEquals(queryBuilder, '');
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('with Literal values', () => {
    it('generates ON MATCH SET with Literal for Cypher functions', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          lastAccessed: new Literal('timestamp()'),
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.lastAccessed = timestamp()',
      );
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates ON MATCH SET with Literal for increment expression', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          accessCount: new Literal('n.accessCount + 1'),
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.accessCount = n.accessCount + 1',
      );
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates ON MATCH SET with mixed Literal and parameterized values', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          lastAccessed: new Literal('timestamp()'),
          status: 'active',
          version: 2,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON MATCH SET n.lastAccessed = timestamp(), n.status = $status, n.version = $version',
      );
      expectBindParamEquals(queryBuilder, { status: 'active', version: 2 });
    });
  });

  describe('integration with MERGE', () => {
    it('generates full MERGE with ON MATCH statement', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'keanu',
          label: 'Person',
          properties: { name: 'Keanu Reeves' },
        })
        .onMatchSet({
          identifier: 'keanu',
          properties: {
            found: new Literal('timestamp()'),
          },
        })
        .return('keanu.name, keanu.found');

      expectStatementEquals(
        queryBuilder,
        'MERGE (keanu:Person { name: $name }) ON MATCH SET keanu.found = timestamp() RETURN keanu.name, keanu.found',
      );
      expectBindParamEquals(queryBuilder, { name: 'Keanu Reeves' });
    });

    it('generates MERGE with ON MATCH and parameterized properties', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'n',
          label: 'User',
          properties: { email: 'test@example.com' },
        })
        .onMatchSet({
          identifier: 'n',
          properties: {
            updatedAt: '2024-01-01',
            status: 'active',
          },
        })
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:User { email: $email }) ON MATCH SET n.updatedAt = $updatedAt, n.status = $status RETURN n',
      );
      expectBindParamEquals(queryBuilder, {
        email: 'test@example.com',
        updatedAt: '2024-01-01',
        status: 'active',
      });
    });

    it('generates MERGE with ON MATCH using literal string', () => {
      const queryBuilder = new QueryBuilder()
        .merge({ identifier: 'n', label: 'Node' })
        .onMatchSet('n.updated = timestamp()')
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:Node) ON MATCH SET n.updated = timestamp() RETURN n',
      );
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('integration with ON CREATE SET and ON MATCH SET together', () => {
    it('generates complete MERGE with both ON CREATE SET and ON MATCH SET', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'n',
          label: 'Counter',
          properties: { name: 'pageViews' },
        })
        .onCreateSet({
          identifier: 'n',
          properties: {
            count: 1,
            created: new Literal('timestamp()'),
          },
        })
        .onMatchSet({
          identifier: 'n',
          properties: {
            count: new Literal('n.count + 1'),
            lastUpdated: new Literal('timestamp()'),
          },
        })
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:Counter { name: $name }) ON CREATE SET n.count = $count, n.created = timestamp() ON MATCH SET n.count = n.count + 1, n.lastUpdated = timestamp() RETURN n',
      );
      expectBindParamEquals(queryBuilder, { name: 'pageViews', count: 1 });
    });

    it('generates complete MERGE pattern from Neo4j documentation example', () => {
      // Example from https://neo4j.com/docs/cypher-manual/current/clauses/merge/#merge-on-create-on-match
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'keanu',
          label: 'Person',
          properties: { name: 'Keanu Reeves' },
        })
        .onCreateSet('keanu.created = timestamp()')
        .return('keanu.name, keanu.created');

      expectStatementEquals(
        queryBuilder,
        'MERGE (keanu:Person { name: $name }) ON CREATE SET keanu.created = timestamp() RETURN keanu.name, keanu.created',
      );
      expectBindParamEquals(queryBuilder, { name: 'Keanu Reeves' });
    });

    it('handles order of ON CREATE SET and ON MATCH SET correctly', () => {
      // ON MATCH before ON CREATE - should still work
      const queryBuilder = new QueryBuilder()
        .merge({ identifier: 'n', label: 'Node' })
        .onMatchSet({
          identifier: 'n',
          properties: { updated: new Literal('timestamp()') },
        })
        .onCreateSet({
          identifier: 'n',
          properties: { created: new Literal('timestamp()') },
        })
        .return('n');

      // Both clauses should be present
      expect(queryBuilder.getStatement()).toContain(
        'ON MATCH SET n.updated = timestamp()',
      );
      expect(queryBuilder.getStatement()).toContain(
        'ON CREATE SET n.created = timestamp()',
      );
    });
  });

  describe('parameter binding uniqueness', () => {
    it('generates unique parameter names when same property used multiple times', () => {
      const queryBuilder = new QueryBuilder()
        .merge({ identifier: 'a', label: 'A', properties: { name: 'First' } })
        .onMatchSet({ identifier: 'a', properties: { name: 'Updated First' } })
        .merge({ identifier: 'b', label: 'B', properties: { name: 'Second' } })
        .onMatchSet({
          identifier: 'b',
          properties: { name: 'Updated Second' },
        });

      const statement = queryBuilder.getStatement();

      // Check that both MERGE statements are present
      expect(statement).toContain('MERGE (a:A { name: $name })');
      expect(statement).toContain('ON MATCH SET a.name =');
      // The second merge will have a unique parameter name (format may vary)
      expect(statement).toMatch(
        /MERGE \(b:B \{ name: \$name[_a-zA-Z0-9]* \}\)/,
      );
      expect(statement).toContain('ON MATCH SET b.name =');

      // Check that bind params are correctly generated - should have 4 unique values
      const bindParams = queryBuilder.getBindParam().get();
      const values = Object.values(bindParams);
      expect(values).toContain('First');
      expect(values).toContain('Updated First');
      expect(values).toContain('Second');
      expect(values).toContain('Updated Second');
      expect(Object.keys(bindParams).length).toBe(4);
    });
  });

  describe('type safety', () => {
    it('accepts valid onMatchSet string parameter', () => {
      const qb = new QueryBuilder();
      qb.onMatchSet('n.updated = timestamp()');
      expect(qb.getStatement()).toContain('ON MATCH SET');
    });

    it('accepts valid onMatchSet object with identifier and properties', () => {
      const qb = new QueryBuilder();
      qb.onMatchSet({ identifier: 'n', properties: { updated: '2024-01-01' } });
      expect(qb.getStatement()).toContain('ON MATCH SET n.updated');
    });

    it('rejects invalid onMatchSet parameter type', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - onMatchSet requires string or OnMatchSetObjectI, not number
        qb.onMatchSet(123);
      }).toThrow("Invalid 'onMatchSet' value");
    });

    it('rejects missing identifier in object form', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - onMatchSet object requires identifier
        qb.onMatchSet({ properties: { updated: '2024-01-01' } });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing properties in object form', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - onMatchSet object requires properties
        qb.onMatchSet({ identifier: 'n' });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects onMatchSet with empty string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.onMatchSet('');
      }).toThrow("Invalid 'onMatchSet' value");
    });

    it('rejects onMatchSet with whitespace-only string parameter', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.onMatchSet('   ');
      }).toThrow("Invalid 'onMatchSet' value");
    });

    it('rejects onMatchSet object with whitespace-only identifier', () => {
      const qb = new QueryBuilder();
      expect(() => {
        qb.onMatchSet({ identifier: '   ', properties: { status: 'active' } });
      }).toThrow("Invalid 'onMatchSet' value");
    });

    it('rejects onMatchSet object with array as properties', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - properties must be a plain object, not an array
        qb.onMatchSet({ identifier: 'n', properties: ['name', 'age'] });
      }).toThrow("Invalid 'onMatchSet' value");
    });

    it('rejects onMatchSet object with null properties', () => {
      const qb = new QueryBuilder();
      expect(() => {
        // @ts-expect-error - properties must be a plain object, not null
        qb.onMatchSet({ identifier: 'n', properties: null });
      }).toThrow("Invalid 'onMatchSet' value");
    });
  });

  describe('with array values', () => {
    it('generates ON MATCH SET with array of strings', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          tags: ['updated', 'modified'],
        },
      });

      expectStatementEquals(queryBuilder, 'ON MATCH SET n.tags = $tags');
      expectBindParamEquals(queryBuilder, { tags: ['updated', 'modified'] });
    });

    it('generates ON MATCH SET with array of numbers', () => {
      const queryBuilder = new QueryBuilder().onMatchSet({
        identifier: 'n',
        properties: {
          history: [10, 20, 30],
        },
      });

      expectStatementEquals(queryBuilder, 'ON MATCH SET n.history = $history');
      expectBindParamEquals(queryBuilder, { history: [10, 20, 30] });
    });
  });

  describe('direct function call', () => {
    it('generates string directly using getOnMatchSetString with string input', () => {
      const bindParam = new BindParam();
      const result = getOnMatchSetString('n.updated = timestamp()', {
        bindParam,
      });

      expect(result).toBe('ON MATCH SET n.updated = timestamp()');
      expect(bindParam.get()).toEqual({});
    });

    it('generates string directly using getOnMatchSetString with object input', () => {
      const bindParam = new BindParam();
      const result = getOnMatchSetString(
        {
          identifier: 'n',
          properties: { status: 'active', count: 5 },
        },
        { bindParam },
      );

      expect(result).toBe('ON MATCH SET n.status = $status, n.count = $count');
      expect(bindParam.get()).toEqual({ status: 'active', count: 5 });
    });
  });

  describe('type guard', () => {
    it('isOnMatchSetObject returns true for valid object parameter', () => {
      const param = { identifier: 'n', properties: { status: 'active' } };
      expect(isOnMatchSetObject(param)).toBe(true);
    });

    it('isOnMatchSetObject returns false for string parameter', () => {
      const param = 'n.updated = timestamp()';
      expect(isOnMatchSetObject(param)).toBe(false);
    });

    it('isOnMatchSetObject returns false for object with empty identifier', () => {
      const param = { identifier: '', properties: { status: 'active' } };
      expect(isOnMatchSetObject(param)).toBe(false);
    });

    it('isOnMatchSetObject returns false for object with null properties', () => {
      const param = { identifier: 'n', properties: null };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isOnMatchSetObject(param)).toBe(false);
    });

    it('isOnMatchSetObject returns false for object missing identifier', () => {
      const param = { properties: { status: 'active' } };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isOnMatchSetObject(param)).toBe(false);
    });

    it('isOnMatchSetObject returns false for object missing properties', () => {
      const param = { identifier: 'n' };
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isOnMatchSetObject(param)).toBe(false);
    });

    it('isOnMatchSetObject returns false for object with whitespace-only identifier', () => {
      const param = { identifier: '   ', properties: { status: 'active' } };
      expect(isOnMatchSetObject(param)).toBe(false);
    });
  });

  describe('chaining and addParams', () => {
    it('works with addParams directly', () => {
      const queryBuilder = new QueryBuilder().addParams({
        onMatchSet: { identifier: 'n', properties: { status: 'active' } },
      });

      expectStatementEquals(queryBuilder, 'ON MATCH SET n.status = $status');
      expectBindParamEquals(queryBuilder, { status: 'active' });
    });

    it('handles multiple consecutive onMatchSet calls', () => {
      const queryBuilder = new QueryBuilder()
        .onMatchSet({ identifier: 'a', properties: { prop1: 'val1' } })
        .onMatchSet({ identifier: 'b', properties: { prop2: 'val2' } });

      const statement = queryBuilder.getStatement();
      expect(statement).toContain('ON MATCH SET a.prop1 = $prop1');
      expect(statement).toContain('ON MATCH SET b.prop2 = $prop2');
      expectBindParamEquals(queryBuilder, { prop1: 'val1', prop2: 'val2' });
    });

    it('shares bindParam across the builder chain', () => {
      const sharedBindParam = new BindParam();
      sharedBindParam.add({ existingParam: 'existingValue' });

      const queryBuilder = new QueryBuilder(sharedBindParam).onMatchSet({
        identifier: 'n',
        properties: { newProp: 'newValue' },
      });

      expect(queryBuilder.getBindParam().get()).toEqual({
        existingParam: 'existingValue',
        newProp: 'newValue',
      });
    });
  });
});
