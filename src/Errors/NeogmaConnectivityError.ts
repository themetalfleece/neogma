import { NeogmaError } from './NeogmaError';

/**
 * Error thrown when connecting to the Neo4j database fails.
 * This can occur due to network issues, invalid credentials, or unavailable database.
 */
export class NeogmaConnectivityError extends NeogmaError {
  constructor(data?: NeogmaConnectivityError['data']) {
    super('Error while connecting to Neo4j', data);
    this.data = data || {};

    Object.setPrototypeOf(this, NeogmaConnectivityError.prototype);
  }
}
