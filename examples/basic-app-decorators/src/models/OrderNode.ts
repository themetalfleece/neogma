import type { Related } from 'neogma';
import {
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

  @Relationship({
    name: 'CONTAINS',
    direction: 'out',
    model: () => OrderItemNode,
    properties: {
      Quantity: { property: 'quantity', schema: Type.Number({ minimum: 1 }) },
    },
  })
  Items!: Related<
    typeof OrderItemNode,
    { Quantity: number },
    { quantity: number }
  >;
}
