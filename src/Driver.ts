import * as neo4j_driver from 'neo4j-driver';
import { QueryRunner } from './QueryRunner';
const neo4j = neo4j_driver;

let driver: neo4j_driver.Driver;
let queryRunner: QueryRunner;

export const getDriver = () => driver;

export const getQueryRunner = () => queryRunner;

interface ConnectParamsI {
    url: string;
    username: string;
    password: string;
}

interface ConnectOptionsI {
    /** whether to log the statements and parameters to the console */
    logging?: QueryRunner['logging'];
}

/**
 * 
 * @param {ConnectParamsI} params - the connection params. If specified, they will be used. Else, the connection params will be taken from the environmental variables
 * @param {ConnectOptionsI} options - additional options for the QueryRunner
 */
export const init = (params: ConnectParamsI, options?: ConnectOptionsI) => {
    const { url, username, password } = params;

    try {
        driver = neo4j.driver(
            url,
            neo4j.auth.basic(username, password),
        );
    } catch (err) {
        console.error(`Error while connecting to the neo4j database`);
        console.error(err);
        process.exit(-1);
    }

    queryRunner = new QueryRunner({
        logging: options?.logging,
    });
};
