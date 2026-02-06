import type { Neo4jSupportedProperties } from '../../QueryRunner';
import type { NeogmaInstance } from '../model.types';
import type { AnyObject } from '../shared.types';
import type {
  PlainWithRelationships,
  RelationshipLevel,
} from './eagerLoading.types';

/**
 * Recursively converts an instance with populated relationships to a plain object.
 * The node properties are extracted via getDataValues(), and nested relationships
 * are recursively converted.
 *
 * @example
 * ```typescript
 * const instance = await Users.findOne({ where: { id: '1' }, relationships: { Orders: {} } });
 * const plain = toPlainWithRelationships(instance, relationshipLevels);
 * // { id: '1', name: 'John', Orders: [{ node: { id: '...', ... }, relationship: { ... } }] }
 * ```
 */
export function toPlainWithRelationships<
  Properties extends Neo4jSupportedProperties,
  RelatedNodesToAssociateI extends AnyObject,
>(
  instance: NeogmaInstance<Properties, RelatedNodesToAssociateI, AnyObject>,
  relationshipLevels: RelationshipLevel[],
): PlainWithRelationships<Properties, RelatedNodesToAssociateI> {
  const dataValues = instance.getDataValues();
  const plain: Record<string, unknown> = { ...dataValues };

  for (const level of relationshipLevels) {
    const relationshipData = (instance as Record<string, unknown>)[
      level.alias
    ] as Array<{ node: NeogmaInstance<any, any, any>; relationship: unknown }>;

    if (relationshipData && Array.isArray(relationshipData)) {
      plain[level.alias] = relationshipData.map((entry) => ({
        node: toPlainWithRelationships(entry.node, level.nestedLevels),
        relationship: entry.relationship,
      }));
    }
  }

  return plain as PlainWithRelationships<Properties, RelatedNodesToAssociateI>;
}
