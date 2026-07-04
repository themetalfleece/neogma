import { Node, NodeEntity, Property, Type } from 'neogma';

@Node({ label: 'ExampleOrderItem', primaryKeyField: 'id' })
export class OrderItemNode extends NodeEntity {
  @Property(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  sku!: string;

  @Property(Type.Number({ minimum: 0 }))
  price!: number;
}
