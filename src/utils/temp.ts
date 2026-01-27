import { randomUUID } from 'crypto';
import type { Driver, QueryResult, Session } from 'neo4j-driver';
import neo4j from 'neo4j-driver';

import { NeogmaError } from '../Errors';

export const TEMPORARY_DB_PREFIX = 'tempneogmadb';

/** Length of prefix + UUID (without dashes): 'tempneogmadb' (12) + 32 hex chars = 44 */
const TEMP_DB_PREFIX_WITH_UUID_LENGTH = 44;

const getCurrentTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000);
};

/**
 * Validates that a database name follows the expected temporary database format.
 * Expected format: tempneogmadb{32-char-uuid}{timestamp}
 * @throws NeogmaError if the format is invalid
 */
const validateTemporaryDatabaseName = (database: string): void => {
  if (!database.startsWith(TEMPORARY_DB_PREFIX)) {
    throw new NeogmaError(
      'Invalid temporary database name: does not start with expected prefix',
      { database, expectedPrefix: TEMPORARY_DB_PREFIX },
    );
  }

  if (database.length <= TEMP_DB_PREFIX_WITH_UUID_LENGTH) {
    throw new NeogmaError(
      'Invalid temporary database name: missing timestamp suffix',
      { database, expectedMinLength: TEMP_DB_PREFIX_WITH_UUID_LENGTH + 1 },
    );
  }

  // Validate that the UUID part contains only hex characters (a-f, 0-9)
  const uuidPart = database.slice(
    TEMPORARY_DB_PREFIX.length,
    TEMP_DB_PREFIX_WITH_UUID_LENGTH,
  );
  if (!/^[a-f0-9]{32}$/i.test(uuidPart)) {
    throw new NeogmaError(
      'Invalid temporary database name: UUID part contains invalid characters',
      { database, uuidPart },
    );
  }

  // Validate that the timestamp part contains only digits
  const timestampPart = database.slice(TEMP_DB_PREFIX_WITH_UUID_LENGTH);
  if (!/^\d+$/.test(timestampPart)) {
    throw new NeogmaError(
      'Invalid temporary database name: timestamp part contains non-numeric characters',
      { database, timestampPart },
    );
  }
};

/**
 * Filters database records to only include temporary neogma databases.
 */
const filterTemporaryDatabasesFromResult = (result: QueryResult) => {
  return result.records.filter(
    (record) => record.get('name').indexOf(TEMPORARY_DB_PREFIX) === 0,
  );
};

/**
 * Attempts to delete a temporary database, user, and role.
 * Operations are fault-tolerant - individual failures are caught and logged
 * since the database/user/role may not exist or may already be deleted.
 */
const deleteDatabaseUserAndRole = async (
  session: Session,
  database: string,
  logger?: (...args: unknown[]) => void,
): Promise<void> => {
  // Validate the database name before attempting operations
  validateTemporaryDatabaseName(database);

  // These operations are intentionally fault-tolerant.
  // Each may fail if the resource doesn't exist, which is acceptable for cleanup.
  try {
    await session.run(`STOP DATABASE ${database};`);
  } catch (error) {
    // Database may not exist or already be stopped
    logger?.(`Failed to stop database ${database}:`, error);
  }
  try {
    await session.run(`DROP DATABASE ${database};`);
  } catch (error) {
    // Database may not exist
    logger?.(`Failed to drop database ${database}:`, error);
  }
  try {
    await session.run(`DROP USER ${database};`);
  } catch (error) {
    // User may not exist
    logger?.(`Failed to drop user ${database}:`, error);
  }
  try {
    await session.run(`DROP ROLE ${database};`);
  } catch (error) {
    // Role may not exist
    logger?.(`Failed to drop role ${database}:`, error);
  }
};

/**
 * Creates a temporary database with a unique name.
 * @throws Error if database creation fails
 */
export const createTempDatabase = async (driver: Driver): Promise<string> => {
  const sessionId = randomUUID().replace(/-/g, '');
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
  } finally {
    await session.close();
  }

  return database;
};

/**
 * Clears a specific temporary database.
 * @param driver - Neo4j driver instance
 * @param database - Name of the temporary database to clear
 * @param logger - Optional logger function for debugging cleanup operations
 */
export const clearTempDatabase = async (
  driver: Driver,
  database: string,
  logger?: (...args: unknown[]) => void,
): Promise<void> => {
  const session = driver.session({ database: 'system' });
  try {
    await deleteDatabaseUserAndRole(session, database, logger);
  } finally {
    await session.close();
  }
};

/**
 * Clears temporary databases older than the specified number of seconds.
 * @param driver - Neo4j driver instance
 * @param seconds - Age threshold in seconds. Databases older than this will be deleted
 * @param logger - Optional logger function for debugging cleanup operations
 */
export const clearTempDatabasesOlderThan = async (
  driver: Driver,
  seconds: number,
  logger?: (...args: unknown[]) => void,
): Promise<void> => {
  const session = driver.session({ database: 'system' });
  const result = await session.run('SHOW DATABASES');
  const shouldExpireAt = getCurrentTimestamp() - seconds;
  try {
    const records = filterTemporaryDatabasesFromResult(result);
    for (const record of records) {
      const database = record.get('name');
      try {
        // Validate format and extract timestamp
        validateTemporaryDatabaseName(database);
        const dbTimestamp = parseInt(
          database.slice(TEMP_DB_PREFIX_WITH_UUID_LENGTH),
          10,
        );
        const isExpired = dbTimestamp <= shouldExpireAt;
        if (isExpired) {
          logger?.(
            `Deleting expired temporary database: ${database} (age: ${getCurrentTimestamp() - dbTimestamp}s)`,
          );
          await deleteDatabaseUserAndRole(session, database, logger);
        }
      } catch (error) {
        logger?.(
          `Skipping database ${database} due to validation error:`,
          error,
        );
      }
    }
  } finally {
    await session.close();
  }
};

/**
 * Clears all temporary databases.
 * @param driver - Neo4j driver instance
 * @param logger - Optional logger function for debugging cleanup operations
 */
export const clearAllTempDatabases = async (
  driver: Driver,
  logger?: (...args: unknown[]) => void,
): Promise<void> => {
  const session = driver.session({ database: 'system' });
  const result = await session.run('SHOW DATABASES');
  try {
    const records = filterTemporaryDatabasesFromResult(result);
    for (const record of records) {
      const database = record.get('name');
      try {
        validateTemporaryDatabaseName(database);
        logger?.(`Deleting temporary database: ${database}`);
        await deleteDatabaseUserAndRole(session, database, logger);
      } catch (error) {
        logger?.(
          `Skipping database ${database} due to validation error:`,
          error,
        );
      }
    }
  } finally {
    await session.close();
  }
};
