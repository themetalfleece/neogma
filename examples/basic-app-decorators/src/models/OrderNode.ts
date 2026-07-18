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

import { OrderItemNode } from './OrderItemNode';

@Node({ label: 'ExampleOrder' })
export class OrderNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  name!: string;

  @Property(Type.Optional(Type.String()))
  status?: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  total?: number;

  // Relationship properties defined as a static class member, co-located
  // with the relationship they belong to. The function form in `properties`
  // defers evaluation until neogma.model() runs (after static initializers).
  static readonly itemRelProps = defineRelationshipProperties({
    Quantity: {
      property: 'quantity',
      schema: Type.Number({ minimum: 1 }),
    },
  });

  @Relationship({
    name: 'CONTAINS',
    direction: 'out',
    model: () => OrderItemNode,
    properties: () => OrderNode.itemRelProps,
  })
  Items!: Related<typeof OrderItemNode, typeof OrderNode.itemRelProps>;
}
