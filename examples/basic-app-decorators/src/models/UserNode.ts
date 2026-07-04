import type { Related } from 'neogma';
import { Node, NodeEntity, Property, Relationship, Type } from 'neogma';

import { OrderNode } from './OrderNode';
import { TagNode } from './TagNode';

@Node({ label: 'ExampleUser', primaryKeyField: 'id' })
export class UserNode extends NodeEntity {
  @Property(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 2 }))
  name!: string;

  @Property(Type.String({ minLength: 3, pattern: '^[^@]+@[^@]+$' }))
  email!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0, maximum: 130 })))
  age?: number;

  @Relationship({
    name: 'CREATES',
    direction: 'out',
    model: () => OrderNode,
    properties: [
      {
        alias: 'Rating',
        property: 'rating',
        schema: Type.Number({ minimum: 1, maximum: 5 }),
      },
    ],
  })
  Orders!: Related<typeof OrderNode, { Rating: number }, { rating: number }>;

  @Relationship({
    name: 'TAGGED_AS',
    direction: 'out',
    model: () => TagNode,
  })
  Tagged!: Related<typeof TagNode>;

  static describe(): string {
    return 'ExampleUser model — connects to orders and tags';
  }

  greet(this: { name: string }): string {
    return `hi, I am ${this.name}`;
  }
}
