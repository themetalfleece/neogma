import type { Related } from 'neogma';
import {
  defineRelationshipProperties,
  Node,
  NodeEntity,
  PrimaryKey,
  Property,
  Relationship,
  Type,
} from 'neogma';

import { OrderNode } from './OrderNode';
import { TagNode } from './TagNode';

@Node({ label: 'ExampleUser' })
export class UserNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 2 }))
  name!: string;

  @Property(Type.String({ minLength: 3, pattern: '^[^@]+@[^@]+$' }))
  email!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0, maximum: 130 })))
  age?: number;

  // Relationship properties defined as a static class member, co-located
  // with the relationship they belong to. The function form in `properties`
  // defers evaluation until neogma.model() runs (after static initializers).
  static readonly orderRelProps = defineRelationshipProperties({
    Rating: {
      property: 'rating',
      schema: Type.Number({ minimum: 1, maximum: 5 }),
    },
  });

  @Relationship({
    name: 'CREATES',
    direction: 'out',
    model: () => OrderNode,
    properties: () => UserNode.orderRelProps,
  })
  Orders!: Related<typeof OrderNode, typeof UserNode.orderRelProps>;

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
