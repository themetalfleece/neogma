/* eslint-disable @typescript-eslint/ban-types */
import { ModelRelationDecoratorOptions } from './shared/data-types';
import { addRelation } from './shared/relation-service';

export function Relation(options: ModelRelationDecoratorOptions): Function {
  return (target: any, propertyName: string) => {
    addRelation(target, propertyName, options);
  };
}
