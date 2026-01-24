import { NeogmaError } from './NeogmaError';

/**
 * Error thrown when connecting to the Neo4j database fails.
 * This can occur due to network issues, invalid credentials, or unavailable database.
 */
export class NeogmaConnectivityError extends NeogmaError {
  constructor(data?: Record<string, unknown>) {
    super('Error while connecting to Neo4j', data);
  }
}
