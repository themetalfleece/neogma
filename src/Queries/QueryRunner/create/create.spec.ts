import { randomUUID as uuid } from 'crypto';

import { Neogma } from '../../..';
import { QueryRunner } from '../..';

const { getResultProperties } = QueryRunner;

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

describe('QueryRunner create', () => {
  it('creates nodes', async () => {
    const label = 'LabelOfQueryRunnerCreate';
    const data = [
      {
        id: uuid(),
        name: uuid(),
      },
      {
        id: uuid(),
        name: uuid(),
      },
    ];
    await neogma.queryRunner.create({
      data,
      label,
    });

    const queryRes = await neogma.queryRunner.run(
      `
                MATCH (n:${label}) where n.id IN $id RETURN n
            `,
      {
        id: data.map(({ id }) => id),
      },
    );

    const properties = getResultProperties<(typeof data)[0]>(queryRes, 'n');

    for (const dataEntry of data) {
      const propertiesEntry = properties.find(({ id }) => id === dataEntry.id);
      expect(dataEntry).toBeTruthy();
      expect(dataEntry).toEqual(propertiesEntry);
    }
  });

  describe('type safety', () => {
    it('accepts valid create parameters', async () => {
      const label = 'TypeTestLabel';
      const data = [{ id: uuid(), name: 'test' }];

      // Verify the method signature accepts these types
      const createPromise = neogma.queryRunner.create({
        data,
        label,
      });
      expect(createPromise).toBeInstanceOf(Promise);
    });

    it('rejects create without required label parameter', () => {
      const _typeCheck = () => {
        // @ts-expect-error - label is required
        neogma.queryRunner.create({
          data: [{ id: '1' }],
        });
      };
      expect(_typeCheck).toBeDefined();
    });

    it('rejects create without required data parameter', () => {
      const _typeCheck = () => {
        // @ts-expect-error - data is required
        neogma.queryRunner.create({
          label: 'TestLabel',
        });
      };
      expect(_typeCheck).toBeDefined();
    });
  });
});
