import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { QueryBuilder } from '../QueryBuilder';
import {
  expectBindParamEquals,
  expectStatementEquals,
  neogma,
} from '../testHelpers';
import { getOnCreateSetString } from './getOnCreateSetString';
import { isOnCreateSetObject } from './getOnCreateSetString.types';

afterAll(async () => {
  await neogma.driver.close();
});

describe('getOnCreateSetString', () => {
  describe('with literal string', () => {
    it('generates ON CREATE SET statement by a literal string', () => {
      const literal = 'n.created = timestamp()';
      const queryBuilder = new QueryBuilder().onCreateSet(literal);

      expectStatementEquals(queryBuilder, `ON CREATE SET ${literal}`);
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates ON CREATE SET with complex literal expression', () => {
      const literal = 'n.created = timestamp(), n.version = 1';
      const queryBuilder = new QueryBuilder().onCreateSet(literal);

      expectStatementEquals(queryBuilder, `ON CREATE SET ${literal}`);
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('with object', () => {
    it('generates ON CREATE SET statement with identifier and properties', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          created: '2024-01-01',
          status: 'new',
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET n.created = $created, n.status = $status',
      );
      expectBindParamEquals(queryBuilder, {
        created: '2024-01-01',
        status: 'new',
      });
    });

    it('generates ON CREATE SET with single property', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'person',
        properties: {
          createdAt: '2024-01-01T00:00:00Z',
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET person.createdAt = $createdAt',
      );
      expectBindParamEquals(queryBuilder, {
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('generates ON CREATE SET with numeric values', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          version: 1,
          count: 0,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET n.version = $version, n.count = $count',
      );
      expectBindParamEquals(queryBuilder, { version: 1, count: 0 });
    });

    it('generates ON CREATE SET with boolean values', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          isNew: true,
          isActive: false,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET n.isNew = $isNew, n.isActive = $isActive',
      );
      expectBindParamEquals(queryBuilder, { isNew: true, isActive: false });
    });

    it('returns empty string when properties object is empty', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {},
      });

      expectStatementEquals(queryBuilder, '');
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('with Literal values', () => {
    it('generates ON CREATE SET with Literal for Cypher functions', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          created: new Literal('timestamp()'),
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET n.created = timestamp()',
      );
      expectBindParamEquals(queryBuilder, {});
    });

    it('generates ON CREATE SET with mixed Literal and parameterized values', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          created: new Literal('timestamp()'),
          name: 'John',
          version: 1,
        },
      });

      expectStatementEquals(
        queryBuilder,
        'ON CREATE SET n.created = timestamp(), n.name = $name, n.version = $version',
      );
      expectBindParamEquals(queryBuilder, { name: 'John', version: 1 });
    });
  });

  describe('integration with MERGE', () => {
    it('generates full MERGE with ON CREATE statement', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'keanu',
          label: 'Person',
          properties: { name: 'Keanu Reeves' },
        })
        .onCreateSet({
          identifier: 'keanu',
          properties: {
            created: new Literal('timestamp()'),
          },
        })
        .return('keanu.name, keanu.created');

      expectStatementEquals(
        queryBuilder,
        'MERGE (keanu:Person { name: $name }) ON CREATE SET keanu.created = timestamp() RETURN keanu.name, keanu.created',
      );
      expectBindParamEquals(queryBuilder, { name: 'Keanu Reeves' });
    });

    it('generates MERGE with ON CREATE and parameterized properties', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'n',
          label: 'User',
          properties: { email: 'test@example.com' },
        })
        .onCreateSet({
          identifier: 'n',
          properties: {
            createdAt: '2024-01-01',
            status: 'pending',
          },
        })
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:User { email: $email }) ON CREATE SET n.createdAt = $createdAt, n.status = $status RETURN n',
      );
      expectBindParamEquals(queryBuilder, {
        email: 'test@example.com',
        createdAt: '2024-01-01',
        status: 'pending',
      });
    });

    it('generates MERGE with both ON CREATE and ON MATCH', () => {
      const queryBuilder = new QueryBuilder()
        .merge({
          identifier: 'n',
          label: 'Person',
          properties: { name: 'John' },
        })
        .onCreateSet({
          identifier: 'n',
          properties: {
            created: new Literal('timestamp()'),
          },
        })
        .onMatchSet({
          identifier: 'n',
          properties: {
            lastSeen: new Literal('timestamp()'),
          },
        })
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:Person { name: $name }) ON CREATE SET n.created = timestamp() ON MATCH SET n.lastSeen = timestamp() RETURN n',
      );
      expectBindParamEquals(queryBuilder, { name: 'John' });
    });

    it('generates MERGE with ON CREATE using literal string', () => {
      const queryBuilder = new QueryBuilder()
        .merge({ identifier: 'n', label: 'Node' })
        .onCreateSet('n.created = timestamp()')
        .return('n');

      expectStatementEquals(
        queryBuilder,
        'MERGE (n:Node) ON CREATE SET n.created = timestamp() RETURN n',
      );
      expectBindParamEquals(queryBuilder, {});
    });
  });

  describe('parameter binding uniqueness', () => {
    it('generates unique parameter names when same property used multiple times', () => {
      const queryBuilder = new QueryBuilder()
        .merge({ identifier: 'a', label: 'A', properties: { name: 'First' } })
        .onCreateSet({ identifier: 'a', properties: { name: 'Created First' } })
        .merge({ identifier: 'b', label: 'B', properties: { name: 'Second' } })
        .onCreateSet({
          identifier: 'b',
          properties: { name: 'Created Second' },
        });

      const statement = queryBuilder.getStatement();

      // Check that both MERGE statements are present
      expect(statement).toContain('MERGE (a:A { name: $name })');
      expect(statement).toContain('ON CREATE SET a.name =');
      // The second merge will have a unique parameter name (format may vary)
      expect(statement).toMatch(
        /MERGE \(b:B \{ name: \$name[_a-zA-Z0-9]* \}\)/,
      );
      expect(statement).toContain('ON CREATE SET b.name =');

      // Check that bind params are correctly generated - should have 4 unique values
      const bindParams = queryBuilder.getBindParam().get();
      const values = Object.values(bindParams);
      expect(values).toContain('First');
      expect(values).toContain('Created First');
      expect(values).toContain('Second');
      expect(values).toContain('Created Second');
      expect(Object.keys(bindParams).length).toBe(4);
    });
  });

  describe('type safety', () => {
    it('accepts valid onCreateSet string parameter', () => {
      const qb = new QueryBuilder();
      qb.onCreateSet('n.created = timestamp()');
      expect(qb.getStatement()).toContain('ON CREATE SET');
    });

    it('accepts valid onCreateSet object with identifier and properties', () => {
      const qb = new QueryBuilder();
      qb.onCreateSet({
        identifier: 'n',
        properties: { created: '2024-01-01' },
      });
      expect(qb.getStatement()).toContain('ON CREATE SET n.created');
    });

    it('rejects invalid onCreateSet parameter type', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - onCreateSet requires string or OnCreateSetObjectI, not number
        qb.onCreateSet(123);
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing identifier in object form', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - onCreateSet object requires identifier
        qb.onCreateSet({ properties: { created: '2024-01-01' } });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects missing properties in object form', () => {
      const qb = new QueryBuilder();
      const _typeCheck = () => {
        // @ts-expect-error - onCreateSet object requires properties
        qb.onCreateSet({ identifier: 'n' });
      };
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('with array values', () => {
    it('generates ON CREATE SET with array of strings', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          tags: ['tag1', 'tag2', 'tag3'],
        },
      });

      expectStatementEquals(queryBuilder, 'ON CREATE SET n.tags = $tags');
      expectBindParamEquals(queryBuilder, { tags: ['tag1', 'tag2', 'tag3'] });
    });

    it('generates ON CREATE SET with array of numbers', () => {
      const queryBuilder = new QueryBuilder().onCreateSet({
        identifier: 'n',
        properties: {
          scores: [1, 2, 3, 4, 5],
        },
      });

      expectStatementEquals(queryBuilder, 'ON CREATE SET n.scores = $scores');
      expectBindParamEquals(queryBuilder, { scores: [1, 2, 3, 4, 5] });
    });
  });

  describe('direct function call', () => {
    it('generates string directly using getOnCreateSetString with string input', () => {
      const bindParam = new BindParam();
      const result = getOnCreateSetString('n.created = timestamp()', {
        bindParam,
      });

      expect(result).toBe('ON CREATE SET n.created = timestamp()');
      expect(bindParam.get()).toEqual({});
    });

    it('generates string directly using getOnCreateSetString with object input', () => {
      const bindParam = new BindParam();
      const result = getOnCreateSetString(
        {
          identifier: 'n',
          properties: { name: 'Test', count: 1 },
        },
        { bindParam },
      );

      expect(result).toBe('ON CREATE SET n.name = $name, n.count = $count');
      expect(bindParam.get()).toEqual({ name: 'Test', count: 1 });
    });
  });

  describe('type guard', () => {
    it('isOnCreateSetObject returns true for object parameter', () => {
      const param = { identifier: 'n', properties: { name: 'test' } };
      expect(isOnCreateSetObject(param)).toBe(true);
    });

    it('isOnCreateSetObject returns false for string parameter', () => {
      const param = 'n.created = timestamp()';
      expect(isOnCreateSetObject(param)).toBe(false);
    });
  });

  describe('chaining and addParams', () => {
    it('works with addParams directly', () => {
      const queryBuilder = new QueryBuilder().addParams({
        onCreateSet: { identifier: 'n', properties: { status: 'new' } },
      });

      expectStatementEquals(queryBuilder, 'ON CREATE SET n.status = $status');
      expectBindParamEquals(queryBuilder, { status: 'new' });
    });

    it('handles multiple consecutive onCreateSet calls', () => {
      const queryBuilder = new QueryBuilder()
        .onCreateSet({ identifier: 'a', properties: { prop1: 'val1' } })
        .onCreateSet({ identifier: 'b', properties: { prop2: 'val2' } });

      const statement = queryBuilder.getStatement();
      expect(statement).toContain('ON CREATE SET a.prop1 = $prop1');
      expect(statement).toContain('ON CREATE SET b.prop2 = $prop2');
      expectBindParamEquals(queryBuilder, { prop1: 'val1', prop2: 'val2' });
    });

    it('shares bindParam across the builder chain', () => {
      const sharedBindParam = new BindParam();
      sharedBindParam.add({ existingParam: 'existingValue' });

      const queryBuilder = new QueryBuilder(sharedBindParam).onCreateSet({
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
