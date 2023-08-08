import { ModelRelationDecoratorOptions } from './data-types';
import { deepAssign } from '../../utils/object';
import { getModelName } from './model-service';

const RELATIONS_KEY = 'neogma:relations';

/**
 * Returns model relations from class by restoring this
 * information from reflect metadata
 */
export function getRelations(target: any): any | undefined {
  const relations = Reflect.getMetadata(RELATIONS_KEY, target);

  if (relations) {
    return Object.keys(relations).reduce((copy, key) => {
      copy[key] = { ...relations[key] };

      return copy;
    }, {});
  }
}

/**
 * Sets relations
 */
export function setRelations(target: any, relations: any): void {
  Reflect.defineMetadata(RELATIONS_KEY, { ...relations }, target);
}

/**
 * Adds model relations by specified relation name and
 * neogma relation options and stores this information
 * through reflect metadata
 */
export function addRelation(
  target: any,
  name: string,
  options: ModelRelationDecoratorOptions,
): void {
  let relations = getRelations(target);

  if (!relations) {
    relations = {};
  }
  if (options.model !== 'self') {
    const relatedModelMetadata = getModelName(options.model['prototype']);

    if (!relatedModelMetadata) {
      throw new Error(
        `Either a @Model annotation is missing for class ${options.model['name']} referenced in ` +
          `relation "${name}" of class "${target.constructor.name}"` +
          ` or annotation order is wrong.`,
      );
    }
  }

  relations[name] = {
    ...options,
    model: options.model === 'self' ? 'self' : options.model['name'],
  };

  setRelations(target, relations);
}

/**
 * Adds property options for specific property
 */
export function addRelationOptions(
  target: any,
  relationName: string,
  options: ModelRelationDecoratorOptions,
): void {
  const relations = getRelations(target);

  if (!relations || !relations[relationName]) {
    throw new Error(
      `@Relation annotation is missing for "${relationName}" of class "${target.constructor.name}"` +
        ` or annotation order is wrong.`,
    );
  }

  relations[relationName] = deepAssign(relations[relationName], options);

  setRelations(target, relations);
}
