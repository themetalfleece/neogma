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

describe('QueryRunner run', () => {
  describe('type safety', () => {
    it('accepts statement string', () => {
      const runPromise = neogma.queryRunner.run('RETURN 1');
      expect(runPromise).toBeInstanceOf(Promise);
    });

    it('accepts statement with parameters', () => {
      const runPromise = neogma.queryRunner.run('RETURN $value', { value: 1 });
      expect(runPromise).toBeInstanceOf(Promise);
    });

    it('rejects run without statement', () => {
      const _typeCheck = () => {
        // @ts-expect-error - statement is required
        neogma.queryRunner.run();
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects run with non-string statement', () => {
      const _typeCheck = () => {
        // @ts-expect-error - statement must be string
        neogma.queryRunner.run(123);
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
