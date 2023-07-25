import { ModelPropertyDecoratorOptions } from '../../../Decorators';
import { deepAssign } from '../../../../utils/object';
import { Neo4jSingleTypes, Neo4jSupportedTypes } from '../../../../Queries';
import {
  DateTime as Neo4jDateTime,
  Date as Neo4jDate,
  Point as Neo4jPoint,
  Time as Neo4jTime,
  Integer as Neo4jInteger,
  LocalDateTime as Neo4jLocalDateTime,
  LocalTime as Neo4jLocalTime,
  Duration as Neo4jDuration,
} from 'neo4j-driver';

const PROPERTIES_KEY = 'neogma:properties';

/**
 * Returns model properties from class by restoring this
 * information from reflect metadata
 */
export function getProperties(target: any): any | undefined {
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
export function setProperties(target: any, properties: any): void {
  Reflect.defineMetadata(PROPERTIES_KEY, { ...properties }, target);
}

/**
 * Adds model property by specified property name and
 * neogma property options and stores this information
 * through reflect metadata
 */
export function addProperty(target: any, name: string, options: any): void {
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

/** Type guard for Neo4jSingleTypes */
export function isNeo4jSingleType(value: any): value is Neo4jSingleTypes {
  return (
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value instanceof Neo4jInteger ||
    value instanceof Neo4jPoint ||
    value instanceof Neo4jDate ||
    value instanceof Neo4jTime ||
    value instanceof Neo4jLocalTime ||
    value instanceof Neo4jDateTime ||
    value instanceof Neo4jLocalDateTime ||
    value instanceof Neo4jDuration
  );
}

/** Type guard for Neo4jSupportedTypes */
export function isNeo4jSupportedType(value: any): value is Neo4jSupportedTypes {
  return (
    isNeo4jSingleType(value) ||
    (Array.isArray(value) && value.every(isNeo4jSingleType))
  );
}
