import { Neogma } from '../..';

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

describe('QueryRunner createRelationship', () => {
  describe('type safety', () => {
    it('accepts valid createRelationship parameters', () => {
      const createRelPromise = neogma.queryRunner.createRelationship({
        source: { label: 'User' },
        target: { label: 'Post' },
        relationship: {
          name: 'CREATED',
          direction: 'out',
        },
        where: {
          source: { id: '1' },
          target: { id: '2' },
        },
      });
      expect(createRelPromise).toBeInstanceOf(Promise);
    });

    it('rejects createRelationship with invalid direction', () => {
      const _typeCheck = () => {
        neogma.queryRunner.createRelationship({
          source: { label: 'User' },
          target: { label: 'Post' },
          relationship: {
            name: 'CREATED',
            // @ts-expect-error - direction must be 'out', 'in', or 'none'
            direction: 'invalid',
          },
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects createRelationship without relationship.name', () => {
      const _typeCheck = () => {
        neogma.queryRunner.createRelationship({
          source: { label: 'User' },
          target: { label: 'Post' },
          // @ts-expect-error - relationship.name is required
          relationship: {
            direction: 'out',
          },
        });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
