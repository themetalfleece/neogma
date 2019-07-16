import * as neo4j_driver from 'neo4j-driver';
const neo4j = neo4j_driver.v1;

let driver: neo4j_driver.v1.Driver;

export const getDriver = () => {
    return driver;
}

export const connect = (url, username, password) => {
    driver = neo4j.driver(
        url,
        neo4j.auth.basic(username, password),
    );
}
