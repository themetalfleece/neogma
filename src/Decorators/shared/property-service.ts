import { ModelPropertyDecoratorOptions } from './data-types';
import { deepAssign } from '../../utils/object';

const PROPERTIES_KEY = 'neogma:properties';

/**
 * Returns model properties from class by restoring this
 * information from reflect metadata
 */
export function getProperties(
  target: any,
): Partial<ModelPropertyDecoratorOptions> | undefined {
  const properties = Reflect.getMetadata(PROPERTIES_KEY, target);

  if (properties) {
    return Object.keys(properties).reduce((copy, key) => {
      copy[key] = { ...properties[key] };

      return copy;
    }, {});
  }
}

/**
 * Sets properties
 */
export function setProperties(target: any, properties: object): void {
  Reflect.defineMetadata(PROPERTIES_KEY, { ...properties }, target);
}

/**
 * Adds model property by specified property name and
 * neogma property options and stores this information
 * through reflect metadata
 */
export function addProperty(
  target: any,
  name: string,
  options: Partial<ModelPropertyDecoratorOptions>,
): void {
  let properties = getProperties(target);

  if (!properties) {
    properties = {};
  }
  properties[name] = { ...options };

  setProperties(target, properties);
}

/**
 * Adds property options for specific property
 */
export function addPropertyOptions(
  target: any,
  propertyName: string,
  options: Partial<ModelPropertyDecoratorOptions>,
): void {
  const properties = getProperties(target);

  if (!properties || !properties[propertyName]) {
    throw new Error(
      `@Property annotation is missing for "${propertyName}" of class "${target.constructor.name}"` +
        ` or annotation order is wrong.`,
    );
  }

  properties[propertyName] = deepAssign(properties[propertyName], options);

  setProperties(target, properties);
}
