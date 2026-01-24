import { Neogma } from '../..';
import { UpdateOp } from '../..';

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

describe('QueryRunner update', () => {
  describe('type safety', () => {
    it('accepts valid update parameters', () => {
      // Type check only - verify the method signature accepts these types
      const _typeCheck = () => {
        neogma.queryRunner.update({
          label: 'TestLabel',
          data: { name: 'updated' },
          where: { node: { id: '123' } },
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('accepts update with UpdateOp.remove', () => {
      // Type check only - verify UpdateOp.remove is accepted
      const _typeCheck = () => {
        neogma.queryRunner.update({
          label: 'TestLabel',
          data: {
            name: 'updated',
            oldField: { [UpdateOp.remove]: true },
          },
          where: { node: { id: '123' } },
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects update without required data parameter', () => {
      const _typeCheck = () => {
        // @ts-expect-error - data is required
        neogma.queryRunner.update({
          label: 'TestLabel',
          where: { node: { id: '123' } },
        });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
