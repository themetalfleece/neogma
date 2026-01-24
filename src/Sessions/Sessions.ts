import { Driver, Session, SessionConfig, Transaction } from 'neo4j-driver';

import { Runnable } from '../QueryRunner';

const isTransaction = (tx: unknown): tx is Transaction =>
  tx !== null &&
  typeof tx === 'object' &&
  'isOpen' in tx &&
  typeof (tx as Transaction).isOpen === 'function';

/**
 * Runs the callback with a session, ensuring proper session lifecycle management.
 * If an existing session is provided, it will be used as-is without closing.
 * If no session is provided, a new session will be created and automatically closed
 * after the callback completes, even if an error occurs.
 *
 * @param runInSession - An existing session to use. If provided, it will be used without creating or closing a session.
 * @param callback - The function to execute with the session
 * @param driver - The Neo4j driver instance
 * @param sessionParams - Optional session configuration parameters
 * @returns The result of the callback function
 * @throws Re-throws any error from the callback after ensuring the session is closed
 */
export const getSession = async <T>(
  runInSession: Session | null,
  callback: (s: Session) => Promise<T>,
  driver: Driver,
  sessionParams?: SessionConfig,
): Promise<T> => {
  if (runInSession) {
    return callback(runInSession);
  }

  const session = driver.session(sessionParams);
  try {
    const result = await callback(session);
    await session.close();
    return result;
  } catch (err) {
    await session.close();
    throw err;
  }
};

/**
 * Runs the callback with a transaction, managing transaction lifecycle automatically.
 * If an existing transaction is provided, it will be used as-is.
 * If a session is provided, a new transaction will be created within that session.
 * If neither is provided, a new session and transaction will be created.
 * Commits on success, rolls back on error, and ensures proper cleanup.
 *
 * @param runInExisting - An existing transaction or session to use. If a transaction is provided,
 *                        it's used directly. If a session is provided, a new transaction is created within it.
 * @param callback - The function to execute with the transaction
 * @param driver - The Neo4j driver instance
 * @param sessionParams - Optional session configuration parameters (used if a new session is created)
 * @returns The result of the callback function
 * @throws Re-throws any error from the callback after ensuring the transaction is rolled back
 */
export const getTransaction = async <T>(
  runInExisting: Runnable | null,
  callback: (tx: Transaction) => Promise<T>,
  driver: Driver,
  sessionParams?: SessionConfig,
): Promise<T> => {
  // if it's a transaction, return it with the callback
  if (isTransaction(runInExisting)) {
    return callback(runInExisting);
  }

  // else get a session (using the runInExisting session if it's passed)
  return getSession(
    runInExisting,
    async (session) => {
      const transaction = session.beginTransaction();
      try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    },
    driver,
    sessionParams,
  );
};

/**
 * Runs the callback with either a session or transaction (Runnable).
 * If an existing Runnable is provided (session or transaction), it will be used as-is.
 * Otherwise, a new session will be created and automatically managed.
 * This is the most flexible option when you don't care whether you're working with a session or transaction.
 *
 * @param runInExisting - An existing Runnable (Session or Transaction) to use. If provided, used as-is.
 * @param callback - The function to execute with the Runnable
 * @param driver - The Neo4j driver instance
 * @param sessionParams - Optional session configuration parameters (used if a new session is created)
 * @returns The result of the callback function
 * @throws Re-throws any error from the callback
 */
export const getRunnable = async <T>(
  runInExisting: Runnable | null | undefined,
  callback: (tx: Runnable) => Promise<T>,
  driver: Driver,
  sessionParams?: SessionConfig,
): Promise<T> => {
  if (runInExisting) {
    return callback(runInExisting);
  }
  return getSession(null, callback, driver, sessionParams);
};
