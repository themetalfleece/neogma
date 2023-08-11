/* eslint-disable @typescript-eslint/ban-types */
import { ModelRelationshipDecoratorOptions } from './shared/data-types';
import { addRelation } from './shared/relationship-service';

export function Relationship(
  options: ModelRelationshipDecoratorOptions,
): Function {
  return (target: any, propertyName: string) => {
    addRelation(target, propertyName, options);
  };
}
