import { BindParam } from '../../BindParam';
import { Literal } from '../../Literal';
import { Neo4jSupportedProperties } from '../../QueryRunner';

/**
 * Returns an object with replacing its values with a bind param value.
 * If value is a literal, returns literal name as value
 * Example return value: { a.p1 = $v1, b.p2 = $v2, c.p3 = literalP3 }
 */
export const getPropertiesWithParams = (
  /** data to set */
  data: Neo4jSupportedProperties,
  /** bind param to use and mutate */
  bindParam: BindParam,
): string => {
  const parts: string[] = [];

  for (const key of Object.keys(data)) {
    if (data[key] instanceof Literal) {
      parts.push(`${key}: ${(data[key] as Literal).getValue()}`);
    } else {
      parts.push(`${key}: $${bindParam.getUniqueNameAndAdd(key, data[key])}`);
    }
  }

  return `{ ${parts.join(', ')} }`;
};
