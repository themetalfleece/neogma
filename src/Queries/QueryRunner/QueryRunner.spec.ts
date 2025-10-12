import { randomUUID as uuid } from 'crypto';
import * as dotenv from 'dotenv';
import { QueryRunner } from '..';
import { Neogma } from '../..';

const { getResultProperties } = QueryRunner;

let neogma: Neogma;

beforeAll(async () => {
  dotenv.config();
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });
});

afterAll(async () => {
  await neogma.driver.close();
});

describe('create', () => {
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
});
