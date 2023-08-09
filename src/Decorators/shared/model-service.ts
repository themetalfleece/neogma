import { ModelClassDecoratorOptions } from './data-types';

const MODEL_NAME_KEY = 'neogma:modelName';
const OPTIONS_KEY = 'neogma:options';

/**
 * Sets model name from class by storing this
 * information through reflect metadata
 */
export function setModelName(target: any, modelName: string): void {
  Reflect.defineMetadata(MODEL_NAME_KEY, modelName, target);
}

/**
 * Returns model name from class by restoring this
 * information from reflect metadata
 */
export function getModelName(target: any): string {
  return Reflect.getMetadata(MODEL_NAME_KEY, target);
}

/**
 * Returns neogma define options from class prototype
 * by restoring this information from reflect metadata
 */
export function getOptions(
  target: any,
): ModelClassDecoratorOptions | undefined {
  const options = Reflect.getMetadata(OPTIONS_KEY, target);

  if (options) {
    return { ...options };
  }
}

/**
 * Sets seuqlize define options to class prototype
 */
export function setOptions(
  target: any,
  options: ModelClassDecoratorOptions,
): void {
  Reflect.defineMetadata(OPTIONS_KEY, { ...options }, target);
}

/**
 * Adds options be assigning new options to old one
 */
export function addOptions(
  target: any,
  options: ModelClassDecoratorOptions,
): void {
  setOptions(target, {
    ...getOptions(target),
    ...options,
  });
}

/**
 * Resolves all model getters of specified options object
 * recursively.
 * So that {model: () => Person} will be converted to
 * {model: Person}
 */
export function resolveModelGetter(options: any): any {
  const maybeModelGetter = (value) =>
    typeof value === 'function' && value.length === 0;
  const isModel = (value) => value && value.prototype;
  const isOptionObjectOrArray = (value) => value && typeof value === 'object';

  return Object.keys(options).reduce(
    (acc, key) => {
      const value = options[key];

      if (maybeModelGetter(value)) {
        const maybeModel = value();

        if (isModel(maybeModel)) {
          acc[key] = maybeModel;
        }
      } else if (isOptionObjectOrArray(value)) {
        acc[key] = resolveModelGetter(value);
      }

      return acc;
    },
    Array.isArray(options) ? [...options] : { ...options },
  );
}
