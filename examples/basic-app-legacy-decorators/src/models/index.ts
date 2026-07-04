import type { Neogma } from 'neogma';
import { clearModelRegistry, toModel } from 'neogma/legacy';

import { OrderItemNode } from './OrderItemNode';
import { OrderNode } from './OrderNode';
import { TagNode } from './TagNode';
import { UserNode } from './UserNode';

/**
 * Build every example model from its decorated class.
 *
 * Order matters: a relationship target must be registered before the model
 * that references it (toModel looks it up in the registry). Leaves first.
 */
export function buildModels(neogma: Neogma) {
  clearModelRegistry();

  const OrderItems = toModel(OrderItemNode, neogma);
  const Tags = toModel(TagNode, neogma);
  const Orders = toModel(OrderNode, neogma);
  const Users = toModel(UserNode, neogma);

  return { Users, Orders, OrderItems, Tags };
}

export type Models = ReturnType<typeof buildModels>;

export { OrderItemNode, OrderNode, TagNode, UserNode };
