import * as uuid from 'uuid';
import neo4j, { Driver, QueryResult, Session } from 'neo4j-driver';

export const TEMPORARY_DB_PREFIX = 'tempneogmadb';

const getCurrentTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000);
};

const filterConsoleDatabasesFromResult = (result: QueryResult<any>) => {
  return result.records.filter(
    (record) => record.get('name').indexOf(TEMPORARY_DB_PREFIX) === 0,
  );
};

const deleteDatabaseUserAndRole = async (
  session: Session,
  database: string,
) => {
  try {
    await session.run(`STOP DATABASE ${database};`);
  } catch (error) {
    console.error(error);
  }
  try {
    await session.run(`DROP DATABASE ${database};`);
  } catch (error) {
    console.error(error);
  }
  try {
    await session.run(`DROP USER ${database};`);
  } catch (error) {
    console.error(error);
  }
  try {
    await session.run(`DROP ROLE ${database};`);
  } catch (error) {
    console.error(error);
  }
};

export const createTempDatabase = async (driver: Driver) => {
  const sessionId = uuid.v4().replace(/-/g, '');
  const currentTimestamp = getCurrentTimestamp();
  const database = `${TEMPORARY_DB_PREFIX}${sessionId}${currentTimestamp}`;

  const session = driver.session({
    database: 'system',
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    await session.run(`CREATE DATABASE ${database} WAIT;`);
    await session.run(
      `CREATE USER ${database} SET PASSWORD '${database}' SET PASSWORD CHANGE NOT REQUIRED;`,
    );
    await session.run(`CREATE ROLE ${database};`);
    await session.run(`GRANT ROLE ${database} TO ${database};`);
    await session.run(`GRANT ALL ON DATABASE ${database} TO ${database};`);
    await session.run(`GRANT ACCESS ON DATABASE ${database} TO ${database};`);
    await session.run(`GRANT READ {*} ON GRAPH ${database} TO ${database};`);
    await session.run(`GRANT TRAVERSE ON GRAPH ${database} TO ${database};`);
    await session.run(`GRANT WRITE ON GRAPH ${database} TO ${database};`);
  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
  }

  return database;
};

export const clearTempDatabase = async (driver: Driver, database: string) => {
  const session = driver.session({ database: 'system' });
  try {
    await deleteDatabaseUserAndRole(session, database);
  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
  }
};

export const clearTempDatabasesOlderThan = async (
  driver: Driver,
  seconds: number,
) => {
  const session = driver.session({ database: 'system' });
  const result = await session.run('SHOW DATABASES');
  const shouldExpireAt = getCurrentTimestamp() - seconds;
  try {
    const records = filterConsoleDatabasesFromResult(result);
    console.log('Databases found: ' + records.length);
    for (const record of records) {
      const database = record.get('name'); //tempneogmadb56e7794ad165454282ee0a7c32a5e3eb1705341040
      const dbTimestamp = parseInt(database.slice(44), 10);
      const isExpired = dbTimestamp <= shouldExpireAt;
      if (isExpired) {
        await deleteDatabaseUserAndRole(session, database);
      } else {
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
  }
};

export const clearAllTempDatabases = async (driver: Driver) => {
  const session = driver.session({ database: 'system' });
  const result = await session.run('SHOW DATABASES');
  try {
    const records = filterConsoleDatabasesFromResult(result);
    for (const record of records) {
      const database = record.get('name');
      await deleteDatabaseUserAndRole(session, database);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
  }
};
