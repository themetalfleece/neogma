import { Driver, Session } from 'neo4j-driver/types';
import { Neo4JJay } from '../Neo4JJay';

/**
 * runs the callback in the given session if defined, else creates a new one
 * 
 * @param runInSession 
 * @param callback 
 */
export const getSession = async <T>(runInSession: Session, callback: (s: Session) => T, driver: Driver) => {
    if (runInSession) {
        return callback(runInSession);
    }
    const session = driver.session();
    const result = await callback(session);
    await session.close();
    return result;
};
