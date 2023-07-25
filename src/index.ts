export * from './Errors';
export * from './Neogma';
export * from './ModelOps';
export * from './Queries';
export * from './Sessions';

export * as neo4jDriver from 'neo4j-driver';

import { Model } from './Decorators/lib/model/model';
import {
  getModelName,
  getOptions,
} from './Decorators/lib/model/shared/model-service';
import { getProperties } from './Decorators/lib/model/shared/property-service';
import { Property } from './Decorators/lib/model/property';
import { NeogmaModelMetadata } from './Decorators';
import 'reflect-metadata';

// Test to see if the metadata is generated properly
@Model({ connection: 'default' })
class ExampleModel {
  @Property({
    schema: {
      type: 'string',
      minLength: 3,
      required: true,
    },
  })
  name: string;
  @Property({
    schema: {},
  })
  size: number;
  @Property({ schema: {} })
  volume: number[];
  @Property({ schema: {} })
  alternates: string[];
}

const metadata = {
  name: getModelName(ExampleModel.prototype),
  options: getOptions(ExampleModel.prototype),
  properties: getProperties(ExampleModel.prototype),
} as NeogmaModelMetadata;

console.log(JSON.stringify(metadata));
