import { NeogmaError } from './NeogmaError';

/**
 * Converts an unknown caught error to a Record for storage in NeogmaError.data.
 * Preserves the original error shape if it's an object, otherwise wraps it.
 */
const toErrorData = (err: unknown): Record<string, unknown> => {
  if (err && typeof err === 'object') {
    return err as Record<string, unknown>;
  }
  return { error: err };
};

/**
 * Error thrown when connecting to the Neo4j database fails.
 * This can occur due to network issues, invalid credentials, or unavailable database.
 */
export class NeogmaConnectivityError extends NeogmaError {
  constructor(err?: unknown) {
    super(
      'Error while connecting to Neo4j',
      err !== undefined ? toErrorData(err) : undefined,
    );
  }
}
