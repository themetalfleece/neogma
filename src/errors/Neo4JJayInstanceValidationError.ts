import { ValidationError } from 'class-validator';
import { Neo4JJayModel } from '../ModelOps';
import { Neo4JJayError } from './Neo4JJayError';

/** Error from validating an instance */
export class Neo4JJayInstanceValidationError extends Neo4JJayError {
    public message: Neo4JJayError['message'];
    public data: {
        model: Neo4JJayModel,
        errors: ValidationError[],
    };

    constructor(
        message: Neo4JJayInstanceValidationError['message'],
        data?: Neo4JJayInstanceValidationError['data'],
    ) {
        super(message, data);
        this.message = message || 'neo4j-jay validation error';
        this.data = data;

        Object.setPrototypeOf(this, Neo4JJayError.prototype);
    }
}
