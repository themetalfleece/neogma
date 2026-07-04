import type { ModelOf } from '@neogma/nest';
import { getModelToken } from '@neogma/nest';
import type { Related } from 'neogma/legacy';
import { Node, NodeEntity, Property, Relationship, Type } from 'neogma/legacy';

import { OrderNode } from './OrderNode';

@Node({ label: 'NestUser', primaryKeyField: 'id' })
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
    name: 'PLACED',
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
}

/** Fully-typed model for DI injection. */
export type UserModel = ModelOf<typeof UserNode>;

/** DI injection token for UserNode. */
export const USER_MODEL_TOKEN = getModelToken(UserNode);
