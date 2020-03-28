import * as neo4j_driver from 'neo4j-driver';
import { Session } from 'neo4j-driver/types';
import { NeogmaModel } from './ModelOps';
import { QueryRunner } from './QueryRunner';
import { getSession } from './Sessions/Sessions';
const neo4j = neo4j_driver;

interface ConnectParamsI {
    url: string;
    username: string;
    password: string;
}

interface ConnectOptionsI {
    /** whether to log the statements and parameters to the console */
    logger?: QueryRunner['logger'];
}

export class Neogma {
    private driver: neo4j_driver.Driver;
    private queryRunner: QueryRunner;
    /** a map between each Model's modelName and the Model itself */
    public modelsByName: Record<string, NeogmaModel> = {};

    /**
     * 
     * @param {ConnectParamsI} params - the connection params. If specified, they will be used. Else, the connection params will be taken from the environmental variables
     * @param {ConnectOptionsI} options - additional options for the QueryRunner
     */
    constructor(params: ConnectParamsI, options?: ConnectOptionsI) {
        const { url, username, password } = params;

        try {
            this.driver = neo4j.driver(
                url,
                neo4j.auth.basic(username, password),
            );
        } catch (err) {
            console.error(`Error while connecting to the neo4j database`);
            console.error(err);
            process.exit(-1);
        }

        this.queryRunner = new QueryRunner({
            logger: options?.logger,
        });
    }

    public getDriver = () => this.driver;

    public getQueryRunner = () => this.queryRunner;

    public getSession = <T>(
        runInSession: Session,
        callback: (s: Session) => T,
    ) => {
        return getSession<T>(runInSession, callback, this.driver);
    }

}
