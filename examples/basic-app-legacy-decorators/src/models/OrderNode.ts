import type { Related } from 'neogma/legacy';
import { Node, NodeEntity, Property, Relationship, Type } from 'neogma/legacy';

import { OrderItemNode } from './OrderItemNode';

@Node({ label: 'ExampleOrder', primaryKeyField: 'id' })
export class OrderNode extends NodeEntity {
  @Property(Type.String())
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
    properties: [
      {
        alias: 'Quantity',
        property: 'quantity',
        schema: Type.Number({ minimum: 1 }),
      },
    ],
  })
  Items!: Related<
    typeof OrderItemNode,
    { Quantity: number },
    { quantity: number }
  >;
}
