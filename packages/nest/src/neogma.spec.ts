/**
 * Unit tests for @neogma/nest — verifies DI tokens, module structure,
 * and compile-time type safety of ModelOf<T>.
 *
 * These tests use legacy decorators (experimentalDecorators: true) to
 * match the typical NestJS environment.
 */
import type { InferProperties, NeogmaModel } from 'neogma';
import type { Related } from 'neogma/legacy';
import {
  clearModelRegistry,
  Node,
  NodeEntity,
  PrimaryKey,
  Property,
  Relationship,
  Type,
} from 'neogma/legacy';

import { NEOGMA_INSTANCE, NEOGMA_MODULE_OPTIONS } from './neogma.constants';
import { getModelToken, NeogmaModule } from './neogma.module';
import type { ModelOf } from './neogma.types';

// ============ Test model classes (legacy decorators) ============

@Node({ label: 'TestOrder' })
class TestOrderNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  item!: string;

  @Property(Type.Number({ minimum: 1 }))
  quantity!: number;
}

@Node({ label: 'TestUser' })
class TestUserNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 2 }))
  name!: string;

  @Property(Type.String())
  email!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  age?: number;

  @Relationship({
    name: 'PLACED',
    direction: 'out',
    model: () => TestOrderNode,
    properties: {
      Rating: { property: 'rating', schema: Type.Number({ minimum: 1, maximum: 5 }) },
    },
  })
  Orders!: Related<
    typeof TestOrderNode,
    { Rating: number },
    { rating: number }
  >;

  greet(this: { name: string }): string {
    return `hello ${this.name}`;
  }

  static describe(): string {
    return 'TestUser model';
  }
}

// ============ Tests ============

describe('@neogma/nest', () => {
  beforeEach(() => {
    clearModelRegistry();
  });

  describe('DI token constants', () => {
    it('NEOGMA_INSTANCE uses namespaced format', () => {
      expect(NEOGMA_INSTANCE).toBe('neogma:instance');
    });

    it('NEOGMA_MODULE_OPTIONS uses namespaced format', () => {
      expect(NEOGMA_MODULE_OPTIONS).toBe('neogma:module-options');
    });
  });

  describe('getModelToken', () => {
    it('generates namespaced token from class', () => {
      expect(getModelToken(TestUserNode)).toBe('neogma:model:TestUserNode');
    });

    it('generates namespaced token from class with different name', () => {
      expect(getModelToken(TestOrderNode)).toBe('neogma:model:TestOrderNode');
    });

    it('generates consistent tokens for the same class', () => {
      const token1 = getModelToken(TestUserNode);
      const token2 = getModelToken(TestUserNode);
      expect(token1).toBe(token2);
    });

    it('generates different tokens for different classes', () => {
      expect(getModelToken(TestUserNode)).not.toBe(
        getModelToken(TestOrderNode),
      );
    });
  });

  describe('NeogmaModule.forRoot', () => {
    it('returns a DynamicModule with providers and exports', () => {
      const module = NeogmaModule.forRoot({
        connection: {
          url: 'bolt://localhost:7687',
          username: 'neo4j',
          password: 'password',
        },
      });

      expect(module.module).toBe(NeogmaModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
      expect(module.providers!.length).toBeGreaterThan(0);
    });

    it('exports NeogmaService and NEOGMA_INSTANCE', () => {
      const module = NeogmaModule.forRoot({
        connection: {
          url: 'bolt://localhost:7687',
          username: 'neo4j',
          password: 'password',
        },
      });

      expect(module.exports).toContain(NEOGMA_INSTANCE);
    });
  });

  describe('NeogmaModule.forRootAsync', () => {
    it('returns a DynamicModule with factory provider', () => {
      const module = NeogmaModule.forRootAsync({
        useFactory: () => ({
          connection: {
            url: 'bolt://localhost:7687',
            username: 'neo4j',
            password: 'password',
          },
        }),
      });

      expect(module.module).toBe(NeogmaModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('includes imports when provided', () => {
      const fakeModule = class FakeConfigModule {};
      const module = NeogmaModule.forRootAsync({
        imports: [fakeModule as any],
        useFactory: () => ({
          connection: {
            url: 'bolt://localhost:7687',
            username: 'neo4j',
            password: 'password',
          },
        }),
      });

      expect(module.imports).toContain(fakeModule);
    });
  });

  describe('NeogmaModule.forFeature', () => {
    it('returns a DynamicModule with model providers', () => {
      const module = NeogmaModule.forFeature([TestOrderNode, TestUserNode]);

      expect(module.module).toBe(NeogmaModule);
      expect(module.providers).toHaveLength(2);
      expect(module.exports).toHaveLength(2);
    });

    it('creates providers with correct tokens', () => {
      const module = NeogmaModule.forFeature([TestOrderNode, TestUserNode]);

      const providerTokens = module.exports as string[];
      expect(providerTokens).toContain('neogma:model:TestOrderNode');
      expect(providerTokens).toContain('neogma:model:TestUserNode');
    });
  });

  describe('ModelOf type safety (compile-time)', () => {
    // These tests verify that ModelOf<T> produces correct types.
    // ts-expect-error directives prove that invalid code IS rejected.
    // If a directive becomes "unused", it means types collapsed to `any`.

    type UserModel = ModelOf<typeof TestUserNode>;
    type OrderModel = ModelOf<typeof TestOrderNode>;
    type UserCreate = Parameters<UserModel['createOne']>[0];
    type OrderCreate = Parameters<OrderModel['createOne']>[0];

    // Helper to suppress unused-variable warnings without runtime cost
    const typeCheck = (fn: () => void) => void fn;

    // ── Positive: valid data compiles ──────────────────────────────

    it('accepts valid user create data', () => {
      const data: UserCreate = { id: 'u1', name: 'A', email: 'a@b' };
      expect(data.id).toBe('u1');
    });

    it('accepts valid user create data with optional age', () => {
      const data: UserCreate = { id: 'u1', name: 'A', email: 'a@b', age: 30 };
      expect(data.age).toBe(30);
    });

    it('accepts valid order create data', () => {
      const data: OrderCreate = { id: 'o1', item: 'X', quantity: 1 };
      expect(data.item).toBe('X');
    });

    it('ModelOf resolves to NeogmaModel', () => {
      type IsModel =
        UserModel extends NeogmaModel<any, any, any, any> ? true : false;
      const check: IsModel = true;
      expect(check).toBe(true);
    });

    it('InferProperties extracts correct shape', () => {
      type Props = InferProperties<TestUserNode>;
      const p: Props = { id: '1', name: 'A', email: 'e', age: 1 };
      expect(p.name).toBe('A');
    });

    it('InferProperties excludes relationship fields', () => {
      type Props = InferProperties<TestUserNode>;
      type HasOrders = 'Orders' extends keyof Props ? true : false;
      const check: HasOrders = false;
      expect(check).toBe(false);
    });

    it('InferProperties excludes methods', () => {
      type Props = InferProperties<TestUserNode>;
      type HasGreet = 'greet' extends keyof Props ? true : false;
      const check: HasGreet = false;
      expect(check).toBe(false);
    });

    // ── Negative: @ts-expect-error proves type errors are caught ──

    it('rejects unknown property on user create', () => {
      typeCheck(() => {
        // @ts-expect-error - bogus is not a user property
        const _: UserCreate = { id: '', name: '', email: '', bogus: 1 };
      });
    });

    it('rejects wrong type for age (string instead of number)', () => {
      typeCheck(() => {
        // @ts-expect-error - age must be number, not string
        const _: UserCreate = { id: '', name: '', email: '', age: 'old' };
      });
    });

    it('rejects wrong type for name (number instead of string)', () => {
      typeCheck(() => {
        // @ts-expect-error - name must be string, not number
        const _: UserCreate = { id: '', name: 42, email: '' };
      });
    });

    it('rejects wrong type for id (number instead of string)', () => {
      typeCheck(() => {
        // @ts-expect-error - id must be string, not number
        const _: UserCreate = { id: 123, name: '', email: '' };
      });
    });

    it('rejects unknown property on order create', () => {
      typeCheck(() => {
        // @ts-expect-error - color is not an order property
        const _: OrderCreate = { id: '', item: '', quantity: 1, color: 'red' };
      });
    });

    it('rejects wrong type for quantity (string instead of number)', () => {
      typeCheck(() => {
        // @ts-expect-error - quantity must be number, not string
        const _: OrderCreate = { id: '', item: '', quantity: 'many' };
      });
    });

    it('rejects assigning UserCreate to OrderCreate', () => {
      typeCheck(() => {
        const user: UserCreate = { id: '', name: '', email: '' };
        // @ts-expect-error - user data is not valid order data (missing item, quantity)
        const _: OrderCreate = user;
      });
    });

    it('rejects assigning OrderCreate to UserCreate', () => {
      typeCheck(() => {
        const order: OrderCreate = { id: '', item: '', quantity: 1 };
        // @ts-expect-error - order data is not valid user data (missing name, email)
        const _: UserCreate = order;
      });
    });

    // ── findOne where clause type safety ──────────────────────────

    it('accepts valid where clause on findOne', () => {
      type FindParams = Parameters<UserModel['findOne']>[0];
      const params: FindParams = { where: { id: 'u1' } };
      expect(params.where).toBeDefined();
    });

    it('accepts where clause with name', () => {
      type FindParams = Parameters<UserModel['findOne']>[0];
      const params: FindParams = { where: { name: 'Alice' } };
      expect(params.where).toBeDefined();
    });

    // ── update data type safety ───────────────────────────────────

    it('accepts valid update data', () => {
      type UpdateData = Parameters<UserModel['update']>[0];
      const data: UpdateData = { name: 'New Name' };
      expect(data.name).toBe('New Name');
    });

    it('rejects wrong type in update data', () => {
      typeCheck(() => {
        type UpdateData = Parameters<UserModel['update']>[0];
        // @ts-expect-error - age must be number, not string
        const _: UpdateData = { age: 'old' };
      });
    });

    // ── build() type safety ───────────────────────────────────────

    it('accepts valid build data', () => {
      type BuildArg = Parameters<UserModel['build']>[0];
      const data: BuildArg = { id: 'u1', name: 'A', email: 'a@b' };
      expect(data.id).toBe('u1');
    });

    it('rejects unknown property on build', () => {
      typeCheck(() => {
        type BuildArg = Parameters<UserModel['build']>[0];
        // @ts-expect-error - foo is not a user property
        const _: BuildArg = { id: '', name: '', email: '', foo: true };
      });
    });

    // ── delete where type safety ──────────────────────────────────

    it('accepts valid delete params', () => {
      type DeleteArg = Parameters<UserModel['delete']>[0];
      const params: DeleteArg = { where: { id: 'u1' }, detach: true };
      expect(params.detach).toBe(true);
    });

    // ── Static methods are preserved ──────────────────────────────

    it('preserves static methods from the class', () => {
      type HasDescribe = 'describe' extends keyof UserModel ? true : false;
      const check: HasDescribe = true;
      expect(check).toBe(true);
    });

    // ── Models are not interchangeable ────────────────────────────

    it('UserModel and OrderModel are distinct types', () => {
      type Same = UserModel extends OrderModel ? true : false;
      const check: Same = false;
      expect(check).toBe(false);
    });
  });
});
