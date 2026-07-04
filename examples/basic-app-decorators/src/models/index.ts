import { clearModelRegistry, type Neogma } from 'neogma';

import { OrderItemNode } from './OrderItemNode';
import { OrderNode } from './OrderNode';
import { TagNode } from './TagNode';
import { UserNode } from './UserNode';

/**
 * Build every example model from its decorated class.
 *
 * Order matters: a relationship target must be registered before the model
 * that references it (neogma.model() looks it up in the registry). Leaves first.
 */
export function buildModels(neogma: Neogma) {
  clearModelRegistry();

  const OrderItems = neogma.model(OrderItemNode);
  const Tags = neogma.model(TagNode);
  const Orders = neogma.model(OrderNode);
  const Users = neogma.model(UserNode);

  return { Users, Orders, OrderItems, Tags };
}

export type Models = ReturnType<typeof buildModels>;

export { OrderItemNode, OrderNode, TagNode, UserNode };
