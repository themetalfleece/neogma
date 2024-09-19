import { NodeClassDecoratorOptions } from './data-types';

const NODE_NAME_KEY = 'neogma:nodeName';
const OPTIONS_KEY = 'neogma:options';

/**
 * Sets node name from class by storing this
 * information through reflect metadata
 */
export function setNodeName(target: any, nodeName: string): void {
  Reflect.defineMetadata(NODE_NAME_KEY, nodeName, target);
}

/**
 * Returns node name from class by restoring this
 * information from reflect metadata
 */
export function getNodeName(target: any): string {
  return Reflect.getMetadata(NODE_NAME_KEY, target);
}

/**
 * Returns neogma define options from class prototype
 * by restoring this information from reflect metadata
 */
export function getOptions(target: any): NodeClassDecoratorOptions | undefined {
  const options = Reflect.getMetadata(OPTIONS_KEY, target);

  if (options) {
    return { ...options };
  }
}

/**
 * Sets node definition options to class prototype
 */
export function setOptions(
  target: any,
  options: NodeClassDecoratorOptions,
): void {
  Reflect.defineMetadata(OPTIONS_KEY, { ...options }, target);
}

/**
 * Adds options be assigning new options to old one
 */
export function addOptions(
  target: any,
  options: NodeClassDecoratorOptions,
): void {
  setOptions(target, {
    ...getOptions(target),
    ...options,
  });
}

/**
 * Resolves all node getters of specified options object
 * recursively.
 * So that {node: () => Person} will be converted to
 * {node: Person}
 */
export function resolveNodeGetter(options: NodeClassDecoratorOptions): any {
  const maybeNodeGetter = (value) =>
    typeof value === 'function' && value.length === 0;
  const isNode = (value) => value && value.prototype;
  const isOptionObjectOrArray = (value) => value && typeof value === 'object';

  return Object.keys(options).reduce(
    (acc, key) => {
      const value = options[key];

      if (maybeNodeGetter(value)) {
        const maybeNode = value();

        if (isNode(maybeNode)) {
          acc[key] = maybeNode;
        }
      } else if (isOptionObjectOrArray(value)) {
        acc[key] = resolveNodeGetter(value);
      }

      return acc;
    },
    Array.isArray(options) ? [...options] : { ...options },
  );
}
