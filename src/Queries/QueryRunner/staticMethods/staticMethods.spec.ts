import { Neogma } from '../../..';
import { QueryRunner } from '../..';

let neogma: Neogma;

beforeAll(async () => {
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });
});

afterAll(async () => {
  await neogma.driver.close();
});

describe('QueryRunner static methods', () => {
  describe('type safety', () => {
    it('getResultProperties returns typed array', async () => {
      const result = await neogma.queryRunner.run('RETURN 1 as value');
      type TestType = { value: number };
      const properties = QueryRunner.getResultProperties<TestType>(
        result,
        'value',
      );
      // Verify it's an array type
      expect(Array.isArray(properties)).toBe(true);
    });

    it('getNodesDeleted returns number', async () => {
      const result = await neogma.queryRunner.run('RETURN 1');
      const deleted = QueryRunner.getNodesDeleted(result);
      expect(typeof deleted).toBe('number');
    });

    it('getRelationshipsDeleted returns number', async () => {
      const result = await neogma.queryRunner.run('RETURN 1');
      const deleted = QueryRunner.getRelationshipsDeleted(result);
      expect(typeof deleted).toBe('number');
    });

    it('identifiers has correct structure', () => {
      expect(QueryRunner.identifiers.default).toBe('nodes');
      expect(QueryRunner.identifiers.createRelationship.source).toBe('source');
      expect(QueryRunner.identifiers.createRelationship.target).toBe('target');
    });
  });
});
