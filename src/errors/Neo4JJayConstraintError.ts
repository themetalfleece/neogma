import { Neo4JJayModel } from 'ModelOps/ModelOps';
import { Neo4JJayError } from './Neo4JJayError';

/** General constraint error */
export class Neo4JJayConstraintError extends Neo4JJayError {
    public message: Neo4JJayError['message'];
    public data: {
        description?: any;
        actual?: any;
        expected?: any;
    };

    constructor(
        message: Neo4JJayConstraintError['message'],
        data?: Neo4JJayConstraintError['data'],
    ) {
        super(message, data);
        this.message = message || 'neo4j-jay constraint error';
        this.data = data;

        Object.setPrototypeOf(this, Neo4JJayError.prototype);
    }
}
