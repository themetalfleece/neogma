import { Node, NodeEntity, PrimaryKey, Property, Type } from 'neogma';

@Node({ label: 'ExampleOrderItem' })
export class OrderItemNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  sku!: string;

  @Property(Type.Number({ minimum: 0 }))
  price!: number;
}
