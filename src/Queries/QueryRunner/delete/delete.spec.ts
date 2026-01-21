import { Neogma } from '../../..';

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

describe('QueryRunner delete', () => {
  describe('type safety', () => {
    it('accepts valid delete parameters', () => {
      // Type check only - verify the method signature accepts these types
      const _typeCheck = () => {
        neogma.queryRunner.delete({
          label: 'TestLabel',
          where: { node: { id: '123' } },
          detach: true,
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('accepts delete with minimal parameters', () => {
      // Type check only - verify the method signature accepts empty object
      const _typeCheck = () => {
        neogma.queryRunner.delete({});
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
