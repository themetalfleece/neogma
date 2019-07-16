import * as dotenv from 'dotenv';
import * as neo4j_driver from 'neo4j-driver';
const neo4j = neo4j_driver.v1;

let driver: neo4j_driver.v1.Driver;

dotenv.config();

export const getDriver = () => {
    return driver;
};

export const connect = () => {
    try {
        driver = neo4j.driver(
            process.env.NEO4J_URL,
            neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
        );
    } catch (err) {
        console.error(`Error while connecting to the neo4j database`);
        console.error(err);
        process.exit(-1);
    }
};
