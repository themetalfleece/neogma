import { Driver, Session, Transaction } from 'neo4j-driver/types';
import { Runnable } from '../Queries/QueryRunner';

const isTransaction = (tx: any): tx is Transaction =>
    typeof tx?.isOpen?.() === 'boolean';

/** runs the callback with a session. It closes it when the callback is done */
export const getSession = async <T>(
    /** an existing session to use. If a session is given, it'll be used as is */
    runInSession: Session | null,
    callback: (s: Session) => Promise<T>,
    driver: Driver,
): Promise<T> => {
    if (runInSession) {
        return callback(runInSession);
    }

    const session = driver.session();
    try {
        const result = await callback(session);
        await session.close();
        return result;
    } catch (err) {
        await session.close();
        throw err;
    }
};

/** runs the callback with a transaction. It closes it if the callback is successful, and rolls it back if not */
export const getTransaction = async <T>(
    /** an existing transaction or session to use. If a transaction is given, it'll be used as is. If a session is given, it'll be used for creating the transaction */
    runInExisting: Runnable | null,
    callback: (tx: Transaction) => Promise<T>,
    driver: Driver,
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
    );
};

/** runs the callback with a session or transaction. If any existing Runnable is given, it gets used. Else, a new Session is used */
export const getRunnable = async <T>(
    runInExisting: Runnable | null | undefined,
    callback: (tx: Runnable) => Promise<T>,
    driver: Driver,
): Promise<T> => {
    if (runInExisting) {
        return callback(runInExisting);
    }
    return getSession(null, callback, driver);
};
