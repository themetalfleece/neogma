import type { ModelOf } from '@neogma/nest';
import { getModelToken } from '@neogma/nest';
import { Node, NodeEntity, Property, Type } from 'neogma/legacy';

@Node({ label: 'NestOrder', primaryKeyField: 'id' })
export class OrderNode extends NodeEntity {
  @Property(Type.String())
  id!: string;

  @Property(Type.String())
  item!: string;

  @Property(Type.Number({ minimum: 1 }))
  quantity!: number;
}

/** Fully-typed model for DI injection. */
export type OrderModel = ModelOf<typeof OrderNode>;

/** DI injection token for OrderNode. */
export const ORDER_MODEL_TOKEN = getModelToken(OrderNode);
