import clone from 'clone';

import { NeogmaError } from '../Errors';
import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import { Literal } from '../Literal';
import { StringSequence } from '../utils/StringSequence';

/**
 * A bind parameter object that should be passed to a query.
 * Throws an error if a duplicate key is added.
 */
export class BindParam {
  /**
   * Acquires a BindParam instance.
   * Returns the provided instance if it exists, or creates a new one.
   */
  public static acquire(bindParam?: BindParam | null): BindParam {
    return bindParam || new BindParam();
  }

  /** the object with the bind param */
  private bind: Record<string, any> = {};

  constructor(...objects: Array<BindParam['bind']>) {
    this.add(...objects);
  }

  /**
   * adds objects to the bind attribute, throwing an error if a given key already exists in the bind param
   */
  public add(...objects: Array<BindParam['bind']>): BindParam {
    for (const object of objects) {
      for (const key in object) {
        if (Object.hasOwn(this.bind, key)) {
          throw new NeogmaConstraintError(
            `key ${key} already in the bind param`,
          );
        }
        this.bind[key] = clone(object[key]);
      }
    }

    return this;
  }

  /**
   * Removes the specified parameter names from the bind param.
   *
   * @param names - A single parameter name or an array of parameter names to remove
   */
  public remove(names: string | string[]): void {
    const namesToUse = Array.isArray(names) ? names : [names];
    for (const name of namesToUse) {
      delete this.bind[name];
    }
  }

  /**
   * returns the bind attribute
   */
  public get(): BindParam['bind'] {
    return this.bind;
  }

  /**
   * Generates a unique parameter name that doesn't conflict with existing bind param keys.
   * If the suffix itself is unique, it's returned as-is. Otherwise, generates a unique
   * variant by appending a sequence (e.g., 'name__aaaa', 'name__aaab', etc.).
   *
   * @param suffix - The base name to use for the parameter
   * @returns A unique parameter name starting with the provided suffix
   * @throws {NeogmaError} If unable to generate a unique name after 10,000 attempts
   */
  public getUniqueName(suffix: string): string {
    if (!Object.hasOwn(this.bind, suffix)) {
      return suffix;
    } else {
      const stringSequence = new StringSequence('a', 'zzzz', 4);

      for (let generationTry = 0; generationTry < 10000; generationTry++) {
        const newKey = suffix + '__' + stringSequence.getNextString(true);
        if (!Object.hasOwn(this.bind, newKey)) {
          return newKey;
        }
      }

      throw new NeogmaError(
        'Max number of tries for string generation reached',
        { suffix, attempts: 10000 },
      );
    }
  }

  /**
   * Generates a unique parameter name and adds the value to the bind param.
   * This is a convenience method that combines {@link getUniqueName} and {@link add}.
   *
   * @param suffix - The base name to use for the parameter
   * @param value - The value to associate with the generated parameter name
   * @returns The unique parameter name that was generated and added
   * @throws {NeogmaError} If unable to generate a unique name after 10,000 attempts
   */
  public getUniqueNameAndAdd(
    suffix: Parameters<(typeof BindParam)['prototype']['getUniqueName']>[0],
    value: Parameters<(typeof BindParam)['prototype']['add']>[0][0],
  ): string {
    const name = this.getUniqueName(suffix);
    this.add({
      [name]: value,
    });
    return name;
  }

  /**
   * Returns a name which isn't a key of bind and adds the value to the bind param with the created name.
   * In case the given value is a Literal, it will be returned as is, without affecting the bind param names and values.
   */
  public getUniqueNameAndAddWithLiteral(
    suffix: Parameters<
      (typeof BindParam)['prototype']['getUniqueNameAndAdd']
    >[0],
    valueOrLiteral:
      | Parameters<(typeof BindParam)['prototype']['getUniqueNameAndAdd']>[1]
      | Literal,
  ): string | Literal {
    if (valueOrLiteral instanceof Literal) {
      return valueOrLiteral;
    }

    return this.getUniqueNameAndAdd(suffix, valueOrLiteral);
  }

  /**
   * returns a new BindParam instance with a clone of the bind property
   */
  public clone(): BindParam {
    return new BindParam(clone(this.get()));
  }
}
