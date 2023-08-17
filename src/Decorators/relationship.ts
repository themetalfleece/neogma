/* eslint-disable @typescript-eslint/ban-types */
import { NodeRelationshipDecoratorOptions } from './shared/data-types';
import { addRelation } from './shared/relationship-service';

export function Relationship(
  options: NodeRelationshipDecoratorOptions,
): Function {
  return (target: any, propertyName: string) => {
    addRelation(target, propertyName, options);
  };
}
