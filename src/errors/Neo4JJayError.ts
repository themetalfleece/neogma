/** The base error which is thrown in neo4j-jay. All other errors entend this. */
export class Neo4JJayError extends Error {
    public message: string;
    public data: object;

    constructor(
        message: Neo4JJayError['message'],
        data?: Neo4JJayError['data'],
    ) {
        super(message);
        this.message = message || 'General neo4j-jay error';
        this.data = data;

        Object.setPrototypeOf(this, Error.prototype);
    }
}
