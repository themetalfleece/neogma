import { Neo4JJayError } from './Neo4JJayError';

/** General constraint error */
export class Neo4JJayNotFoundError extends Neo4JJayError {
    public message: Neo4JJayError['message'];
    public data: object;

    constructor(
        message: Neo4JJayNotFoundError['message'],
        data?: Neo4JJayNotFoundError['data'],
    ) {
        super(message, data);
        this.message = message || 'neo4j-jay not found error';
        this.data = data;

        Object.setPrototypeOf(this, Neo4JJayError.prototype);
    }
}
