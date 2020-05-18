import { Driver, Session } from 'neo4j-driver/types';
import { Neogma } from '../Neogma';

/**
 * runs the callback in the given session if defined, else creates a new one
 * 
 * @param runInSession 
 * @param callback 
 */
export const getSession = async <T>(runInSession: Session | null, callback: (s: Session) => Promise<T>, driver: Driver) => {
    if (runInSession) {
        return callback(runInSession);
    }
    const session = driver.session();
    const result = await callback(session);
    await session.close();
    return result;
};
