import { ModelRelationshipDecoratorOptions } from './data-types';
import { deepAssign } from '../../utils/object';
import { getModelName } from './model-service';

const RELATIONS_KEY = 'neogma:relationships';

/**
 * Returns model relationships from class by restoring this
 * information from reflect metadata
 */
export function getRelations(
  target: any,
): Record<string, ModelRelationshipDecoratorOptions> | undefined {
  const relationships = Reflect.getMetadata(RELATIONS_KEY, target);

  if (relationships) {
    return Object.keys(relationships).reduce((copy, key) => {
      copy[key] = { ...relationships[key] };

      return copy;
    }, {});
  }
}

/**
 * Sets relationships
 */
export function setRelations(
  target: any,
  relationships: Record<string, ModelRelationshipDecoratorOptions>,
): void {
  Reflect.defineMetadata(RELATIONS_KEY, { ...relationships }, target);
}

/**
 * Adds model relationships by specified relationship name and
 * neogma relationship options and stores this information
 * through reflect metadata
 */
export function addRelation(
  target: any,
  name: string,
  options: ModelRelationshipDecoratorOptions,
): void {
  let relationships = getRelations(target);

  if (!relationships) {
    relationships = {};
  }
  if (options.model !== 'self') {
    const relatedModelMetadata = getModelName(options.model['prototype']);

    if (!relatedModelMetadata) {
      throw new Error(
        `Either a @Model annotation is missing for class ${options.model['name']} referenced in ` +
          `relationship "${name}" of class "${target.constructor.name}"` +
          ` or annotation order is wrong.`,
      );
    }
  }

  relationships[name] = {
    ...options,
    model: options.model === 'self' ? 'self' : options.model['prototype'],
  };

  setRelations(target, relationships);
}

/**
 * Adds property options for specific property
 */
export function addRelationOptions(
  target: any,
  relationName: string,
  options: ModelRelationshipDecoratorOptions,
): void {
  const relationships = getRelations(target);

  if (!relationships || !relationships[relationName]) {
    throw new Error(
      `@Relationships annotation is missing for "${relationName}" of class "${target.constructor.name}"` +
        ` or annotation order is wrong.`,
    );
  }

  relationships[relationName] = deepAssign(
    relationships[relationName],
    options,
  );

  setRelations(target, relationships);
}
