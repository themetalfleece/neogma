import { Neogma } from './Neogma';
import * as dotenv from 'dotenv';
import { TEMPORARY_DB_PREFIX } from './utils/temp';

describe('Neogma', () => {
  let neogma: Neogma;

  beforeAll(async () => {
    dotenv.config();
    neogma = await Neogma.fromTempDatabase({
      url: process.env.NEO4J_URL ?? '',
      username: process.env.NEO4J_USERNAME ?? '',
      password: process.env.NEO4J_PASSWORD ?? '',
    });

    await neogma.verifyConnectivity();
  });

  afterAll(async () => {
    await neogma.clearAllTempDatabases();
    await neogma.driver.close();
  });

  it('should be defined', () => {
    expect(neogma).toBeDefined();
    expect(neogma.database).toBeDefined();
    expect(neogma.database).not.toBeNull();
  });

  it('should have created a temp db', async () => {
    expect(neogma.database?.indexOf(TEMPORARY_DB_PREFIX)).toBe(0);
  });
});
