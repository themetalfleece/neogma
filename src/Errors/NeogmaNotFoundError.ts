import { NeogmaError } from './NeogmaError';

/**
 * Error thrown when a requested resource (node, relationship, model) is not found.
 * Typically used in findOne operations when throwIfNotFound is true.
 */
export class NeogmaNotFoundError extends NeogmaError {
  constructor(message: string, data?: Record<string, unknown>) {
    super(message, data);
  }
}
