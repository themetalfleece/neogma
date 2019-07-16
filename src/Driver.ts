import * as dotenv from 'dotenv';
import * as neo4j_driver from 'neo4j-driver';
const neo4j = neo4j_driver.v1;

let driver: neo4j_driver.v1.Driver;

dotenv.config();

export const getDriver = () => {
    return driver;
};

interface IConnectParams {
    url: string;
    username: string;
    password: string;
}
/**
 * 
 * @param {IConnectParams} params - the connection params. If specified, they will be used. Else, the connection params will be taken from the environmental variables
 */
export const connect = (params?: IConnectParams) => {
    const url = params ? params.url : process.env.NEO4J_URL;
    const username = params ? params.username : process.env.NEO4J_USERNAME;
    const password = params ? params.password : process.env.NEO4J_PASSWORD;

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
};
