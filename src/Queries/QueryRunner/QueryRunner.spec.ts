import * as dotenv from 'dotenv';
import { QueryBuilder, QueryRunner } from '..';
import { Neogma } from '../..';
import * as uuid from 'uuid';

const { getResultProperties } = QueryRunner;

let neogma: Neogma;

beforeAll(async () => {
  dotenv.config();
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });
  QueryBuilder.queryRunner = neogma.queryRunner;
});

afterAll(async () => {
  await neogma.driver.close();
});

describe('create', () => {
  it('creates nodes', async () => {
    const label = 'LabelOfQueryRunnerCreate';
    const data = [
      {
        id: uuid.v4(),
        name: uuid.v4(),
      },
      {
        id: uuid.v4(),
        name: uuid.v4(),
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
