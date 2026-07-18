import type {
  AsNeo4jProperties,
  InferMethods,
  InferProperties,
  InferRelatedNodes,
  InferStatics,
  NeogmaModel,
  NodeEntityClass,
} from 'neogma';

/**
 * Infers the fully-typed `NeogmaModel` for a decorated class.
 *
 * Use this to type constructor-injected models in NestJS services so that
 * `createOne`, `findMany`, `update`, etc. are fully type-safe.
 *
 * @example
 * ```typescript
 * import { ModelOf, getModelToken } from '@neogma/nest';
 * import { UserNode } from '../models';
 *
 * @Injectable()
 * export class UsersService {
 *   constructor(
 *     @Inject(getModelToken(UserNode))
 *     private readonly Users: ModelOf<typeof UserNode>,
 *   ) {}
 *
 *   async create() {
 *     // ✅ Fully typed — createOne knows the exact properties
 *     await this.Users.createOne({ id: '1', name: 'Alice', email: '...' });
 *   }
 * }
 * ```
 */
export type ModelOf<TClass extends NodeEntityClass> = NeogmaModel<
  AsNeo4jProperties<InferProperties<InstanceType<TClass>>>,
  InferRelatedNodes<InstanceType<TClass>>,
  InferMethods<InstanceType<TClass>>,
  InferStatics<TClass>
>;
