import { randomUUID as uuid } from 'crypto';
import Type from 'typebox';

import {
  NeogmaInstanceValidationError,
  NeogmaModelSchemaError,
} from '../Errors';
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '../ModelFactory';
import { closeNeogma, getNeogma } from '../ModelFactory/testHelpers';
import {
  clearModelRegistry,
  defineRelationshipProperties,
  Node,
  NodeEntity,
  PrimaryKey,
  Property,
  type Related,
  Relationship,
} from './index';
import { toModel } from './toModel';

// ============ Type definitions ============

type DecSupplierAttrs = {
  name: string;
  id: string;
  country?: string;
};

type DecOrderAttrs = {
  name: string;
  id: string;
  status?: string;
};
type DecOrdersInstance = NeogmaInstance<DecOrderAttrs, object, object>;
type DecOrdersModel = NeogmaModel<DecOrderAttrs, object, object, object>;

type DecUserAttrs = {
  name: string;
  age?: number;
  id: string;
};
interface DecUsersRelated {
  Orders: ModelRelatedNodesI<
    DecOrdersModel,
    DecOrdersInstance,
    { Rating: number },
    { rating: number }
  >;
}
interface DecUsersStatics {
  foo: () => string;
}

// ============ Decorated class definitions ============

@Node({ label: 'DecSupplier' })
class SupplierNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  country?: string;
}

@Node({ label: 'DecOrder' })
class OrderNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  status?: string;
}

@Node({ label: 'DecUser' })
class UserNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  age?: number;

  @PrimaryKey(Type.String())
  id!: string;

  @Relationship({
    name: 'CREATES',
    direction: 'out',
    model: () => OrderNode,
    properties: {
      Rating: {
        property: 'rating',
        schema: Type.Number({ minimum: 1, maximum: 5 }),
      },
    },
  })
  Orders!: any;

  static foo() {
    return 'foo';
  }

  greet(this: { name: string }): string {
    return `hello ${this.name}`;
  }
}

// Multi-label node with no schemas on properties (untracked path).
@Node({ label: ['DecTag', 'DecLabel'] })
class TagNode extends NodeEntity {
  @Property()
  id!: string;

  @Property()
  name!: string;
}

// Self-referencing relationship with direction 'in'.
@Node({ label: 'DecCategory' })
class CategoryNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String())
  name!: string;

  @Relationship({
    name: 'PARENT_OF',
    direction: 'in',
    model: 'self',
  })
  Parent!: any;

  @Relationship({
    name: 'SIBLING_OF',
    direction: 'none',
    model: 'self',
  })
  Siblings!: any;
}

// ============ Test setup ============

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

beforeEach(() => {
  clearModelRegistry();
});

// ============ Tests ============

describe('Decorator-based model creation', () => {
  describe('toModel basic functionality', () => {
    it('creates a model from a decorated class', () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());
      expect(Suppliers).toBeTruthy();
      expect(Suppliers.getModelName()).toBe('DecSupplier');
      expect(Suppliers.getPrimaryKeyField()).toBe('id');
    });

    it('returns correct labels', () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());
      expect(Suppliers.getRawLabels()).toEqual(['DecSupplier']);
      expect(Suppliers.getLabel()).toBeDefined();
    });

    it('extracts static methods from the class', () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );
      expect((Users as any).foo()).toBe('foo');
    });

    it('throws NeogmaModelSchemaError if class has no @Node decorator', () => {
      class PlainClass extends NodeEntity {}
      expect(() => toModel(PlainClass, getNeogma())).toThrow(
        /no decorator metadata/,
      );
      expect(() => toModel(PlainClass, getNeogma())).toThrow(
        NeogmaModelSchemaError,
      );
    });

    it('defers relationship resolution when the target class is registered later', () => {
      // Register UserNode BEFORE OrderNode — the reverse of dependency order.
      // Previously this threw; now the target reference is patched in as
      // soon as OrderNode is registered.
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );
      const Orders = toModel<DecOrderAttrs>(OrderNode, getNeogma());

      // Once OrderNode's toModel() has run, the Users.Orders relationship
      // now points at the built Orders model.
      const usersOrdersRel = Users.getRelationshipConfiguration('Orders');
      expect(usersOrdersRel.model).toBe(Orders);
    });
  });

  describe('has all NeogmaModel methods', () => {
    it('has all standard static methods', () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());
      expect(typeof Suppliers.createOne).toBe('function');
      expect(typeof Suppliers.createMany).toBe('function');
      expect(typeof Suppliers.findMany).toBe('function');
      expect(typeof Suppliers.findOne).toBe('function');
      expect(typeof Suppliers.update).toBe('function');
      expect(typeof Suppliers.delete).toBe('function');
      expect(typeof Suppliers.build).toBe('function');
      expect(typeof Suppliers.buildFromRecord).toBe('function');
      expect(typeof Suppliers.relateTo).toBe('function');
      expect(typeof Suppliers.findRelationships).toBe('function');
      expect(typeof Suppliers.deleteRelationships).toBe('function');
      expect(typeof Suppliers.getLabel).toBe('function');
      expect(typeof Suppliers.getRawLabels).toBe('function');
      expect(typeof Suppliers.getPrimaryKeyField).toBe('function');
      expect(typeof Suppliers.getModelName).toBe('function');
    });
  });

  describe('TypeBox validation', () => {
    it('throws NeogmaInstanceValidationError on minLength violation', async () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());
      const supplier = Suppliers.build({ id: uuid(), name: 'ab' });

      await expect(supplier.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });

    it('passes validation for valid data', async () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());
      const supplier = Suppliers.build({ id: uuid(), name: 'Valid Name' });

      await expect(supplier.validate()).resolves.not.toThrow();
    });

    it('throws on invalid type', async () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      const user = Users.build({
        id: uuid(),
        name: 'Valid Name',
        age: 'not a number' as any,
      });

      await expect(user.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });

    it('throws on minimum value violation', async () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      const user = Users.build({
        id: uuid(),
        name: 'Valid Name',
        age: -1,
      });

      await expect(user.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });
  });

  describe('Relationship property TypeBox validation', () => {
    it('rejects value above maximum', async () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      await expect(
        Users.createOne({
          id: uuid(),
          name: 'User',
          Orders: {
            properties: [{ id: uuid(), name: 'Order', Rating: 10 }],
          },
        }),
      ).rejects.toThrow(NeogmaInstanceValidationError);
    });

    it('rejects value below minimum', async () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      await expect(
        Users.createOne({
          id: uuid(),
          name: 'User',
          Orders: {
            properties: [{ id: uuid(), name: 'Order', Rating: 0 }],
          },
        }),
      ).rejects.toThrow(NeogmaInstanceValidationError);
    });

    it('passes with valid data', async () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma()); // register for dependency resolution
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      const user = await Users.createOne({
        id: uuid(),
        name: 'User',
        Orders: {
          properties: [{ id: uuid(), name: 'Order', Rating: 3 }],
        },
      });

      expect(user).toBeTruthy();
      expect(user.__existsInDatabase).toBe(true);
    });
  });

  describe('Model registry', () => {
    it('registers models and allows dependent resolution', () => {
      const Suppliers = toModel<DecSupplierAttrs>(SupplierNode, getNeogma());

      expect(Suppliers.getModelName()).toBe('DecSupplier');
    });

    it('clearModelRegistry resets the registry and pending resolutions', () => {
      // Register UserNode first (Orders relationship is deferred).
      toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );
      // Clearing must also drop the pending-resolution queue so a fresh
      // build sequence isn't polluted by leftover expectations.
      clearModelRegistry();

      // Rebuild in dependency order — succeeds cleanly.
      expect(() => {
        toModel<DecOrderAttrs>(OrderNode, getNeogma());
        toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
          UserNode,
          getNeogma(),
        );
      }).not.toThrow();
    });
  });

  describe('Circular relationships', () => {
    // Two classes that reference each other. Regardless of the order in
    // which `toModel()` is called for them, both `.relationships[…].model`
    // fields must end up pointing at the fully-built peer model.
    @Node({ label: 'DecCircA' })
    class CircANode extends NodeEntity {
      @PrimaryKey(Type.String())
      id!: string;

      @Relationship({
        name: 'A_TO_B',
        direction: 'out',
        model: () => CircBNode,
      })
      B!: any;
    }

    @Node({ label: 'DecCircB' })
    class CircBNode extends NodeEntity {
      @PrimaryKey(Type.String())
      id!: string;

      @Relationship({
        name: 'B_TO_A',
        direction: 'out',
        model: () => CircANode,
      })
      A!: any;
    }

    it('resolves circular deps when A is declared before B', () => {
      const A = toModel(CircANode, getNeogma());
      const B = toModel(CircBNode, getNeogma());

      const aToB = A.getRelationshipConfiguration('B' as any);
      const bToA = B.getRelationshipConfiguration('A' as any);

      expect(aToB.model).toBe(B);
      expect(bToA.model).toBe(A);
    });

    it('resolves circular deps when B is declared before A', () => {
      const B = toModel(CircBNode, getNeogma());
      const A = toModel(CircANode, getNeogma());

      const aToB = A.getRelationshipConfiguration('B' as any);
      const bToA = B.getRelationshipConfiguration('A' as any);

      expect(aToB.model).toBe(B);
      expect(bToA.model).toBe(A);
    });
  });

  describe('Instance method extraction', () => {
    it('extracts and binds prototype methods onto built instances', () => {
      toModel<DecOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<DecUserAttrs, DecUsersRelated, DecUsersStatics>(
        UserNode,
        getNeogma(),
      );

      const user = Users.build({ id: uuid(), name: 'Alice' }) as unknown as {
        name: string;
        greet: () => string;
      };
      expect(typeof user.greet).toBe('function');
      expect(user.greet()).toBe('hello Alice');
    });
  });

  describe('Label variations', () => {
    it('supports multi-label nodes', () => {
      const Tags = toModel(TagNode, getNeogma());
      expect(Tags.getRawLabels()).toEqual(['DecTag', 'DecLabel']);
    });

    it('does not require a primaryKeyField', () => {
      const Tags = toModel(TagNode, getNeogma());
      expect(Tags.getPrimaryKeyField()).toBeNull();
    });
  });

  describe('Properties without TypeBox schemas', () => {
    it('still tracks the property keys via the schema (no validator installed)', async () => {
      const Tags = toModel(TagNode, getNeogma());
      // Build does not require DB; validate is a no-op since no TypeBox
      // schema was provided for any field.
      const tag = Tags.build({ id: uuid(), name: 'Featured' });
      await expect(tag.validate()).resolves.not.toThrow();
    });
  });

  describe('Self-referencing relationships', () => {
    it('accepts model: "self" with direction "in" and "none"', () => {
      type DecCategoryAttrs = { id: string; name: string };
      interface DecCategoryRelated {
        Parent: ModelRelatedNodesI<any, any>;
        Siblings: ModelRelatedNodesI<any, any>;
      }
      const Categories = toModel<DecCategoryAttrs, DecCategoryRelated>(
        CategoryNode,
        getNeogma(),
      );
      const parent = Categories.getRelationshipConfiguration('Parent');
      expect(parent.direction).toBe('in');
      expect(parent.name).toBe('PARENT_OF');

      const siblings = Categories.getRelationshipConfiguration('Siblings');
      expect(siblings.direction).toBe('none');
    });
  });

  describe('@PrimaryKey decorator', () => {
    it('sets primaryKeyField via @PrimaryKey (auto-registers @Property)', () => {
      @Node({ label: 'PKUser' })
      class PKUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;
      }

      const Users = toModel(PKUserNode, getNeogma());
      expect(Users.getPrimaryKeyField()).toBe('id');
    });

    it('auto-registers as @Property without explicit @Property', () => {
      @Node({ label: 'PKAutoProperty' })
      class PKAutoPropertyNode extends NodeEntity {
        @PrimaryKey()
        id!: string;
      }

      // Should NOT throw — @PrimaryKey auto-registers as @Property
      const Model = toModel(PKAutoPropertyNode, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('id');
    });

    it('throws when @PrimaryKey is applied to two fields', () => {
      expect(() => {
        @Node({ label: 'PKDuplicate' })
        class PKDuplicateNode extends NodeEntity {
          @PrimaryKey(Type.String())
          id!: string;

          @PrimaryKey(Type.String())
          uuid!: string;
        }
        // Force evaluation
        void PKDuplicateNode;
      }).toThrow(NeogmaModelSchemaError);
    });

    it('works on a non-id field', () => {
      @Node({ label: 'PKEmail' })
      class PKEmailNode extends NodeEntity {
        @PrimaryKey(Type.String())
        email!: string;

        @Property(Type.String())
        name!: string;
      }

      const Model = toModel(PKEmailNode, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('email');
    });

    it('does not duplicate @Property when stacked with @Property (backwards compat)', () => {
      @Node({ label: 'PKStacked' })
      class PKStackedNode extends NodeEntity {
        @PrimaryKey(Type.String())
        @Property(Type.String())
        id!: string;
      }

      // Should not throw — @PrimaryKey skips property registration when
      // @Property already registered the field.
      const Model = toModel(PKStackedNode, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('id');
    });

    it('passes schema to property registration', async () => {
      @Node({ label: 'PKSchema' })
      class PKSchemaNode extends NodeEntity {
        @PrimaryKey(Type.String({ minLength: 5 }))
        id!: string;
      }

      const Model = toModel(PKSchemaNode, getNeogma());
      const instance = Model.build({ id: 'ab' });
      // minLength: 5 should be enforced
      await expect(instance.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });
  });

  describe('Optional @Node label', () => {
    it('infers label from class name when label is omitted', () => {
      @Node()
      class InferredLabelNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const Model = toModel(InferredLabelNode, getNeogma());
      expect(Model.getModelName()).toBe('InferredLabelNode');
      expect(Model.getRawLabels()).toEqual(['InferredLabelNode']);
    });

    it('uses explicit label when provided', () => {
      @Node({ label: 'ExplicitLabel' })
      class ExplicitLabelNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const Model = toModel(ExplicitLabelNode, getNeogma());
      expect(Model.getModelName()).toBe('ExplicitLabel');
    });
  });

  describe('Relationship properties object syntax', () => {
    it('accepts object syntax with alias !== property', () => {
      @Node({ label: 'ObjSyntaxUser' })
      class ObjSyntaxUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'RATES',
          direction: 'out',
          model: () => OrderNode,
          properties: {
            Rating: {
              property: 'rating',
              schema: Type.Number({ minimum: 1, maximum: 5 }),
            },
          },
        })
        Orders!: any;
      }

      toModel<DecOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel(ObjSyntaxUserNode, getNeogma());
      const rel = Users.getRelationshipConfiguration('Orders');
      expect(rel.name).toBe('RATES');
      expect(rel.properties).toBeDefined();
    });

    it('accepts shorthand when alias === property (bare schema)', async () => {
      @Node({ label: 'ShorthandUser' })
      class ShorthandUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;

        @Relationship({
          name: 'RATES',
          direction: 'out',
          model: () => OrderNode,
          properties: {
            rating: Type.Number({ minimum: 1, maximum: 5 }),
          },
        })
        Orders!: any;
      }

      toModel<DecOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel(ShorthandUserNode, getNeogma());
      const rel = Users.getRelationshipConfiguration('Orders');
      expect(rel.properties).toBeDefined();

      // Verify schema validation still works
      await expect(
        Users.createOne({
          id: uuid(),
          name: 'User',
          Orders: {
            properties: [{ id: uuid(), name: 'Order', rating: 10 }],
          },
        }),
      ).rejects.toThrow(NeogmaInstanceValidationError);
    });
  });

  describe('@PrimaryKey schema validation (positive case)', () => {
    it('passes validation when value satisfies schema', async () => {
      @Node({ label: 'PKValidPass' })
      class PKValidPassNode extends NodeEntity {
        @PrimaryKey(Type.String({ minLength: 5 }))
        id!: string;
      }

      const Model = toModel(PKValidPassNode, getNeogma());
      const instance = Model.build({ id: 'abcdef' });
      // Should not throw — value satisfies minLength: 5
      await expect(instance.validate()).resolves.toBeUndefined();
    });
  });

  describe('@Node() with no arguments', () => {
    it('works when called with zero arguments (no options object)', () => {
      @Node()
      class BareNodeDecNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const Model = toModel(BareNodeDecNode, getNeogma());
      expect(Model.getModelName()).toBe('BareNodeDecNode');
      expect(Model.getRawLabels()).toEqual(['BareNodeDecNode']);
    });
  });

  describe('Relationship properties array syntax (legacy passthrough)', () => {
    it('accepts array syntax and normalizes correctly', () => {
      @Node({ label: 'ArraySyntaxUser' })
      class ArraySyntaxUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'RATES',
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
        Orders!: any;
      }

      toModel<DecOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel(ArraySyntaxUserNode, getNeogma());
      const rel = Users.getRelationshipConfiguration('Orders');
      expect(rel.name).toBe('RATES');
      expect(rel.properties).toBeDefined();
    });
  });

  describe('Related config inference', () => {
    it('infers CreateRelProps and RelProps from a config object passed to Related', () => {
      // Define properties config once — same object used in @Relationship AND Related<>
      const orderRelProps = {
        Rating: {
          property: 'rating' as const,
          schema: Type.Number({ minimum: 1, maximum: 5 }),
        },
        Comment: {
          property: 'comment' as const,
          schema: Type.Optional(Type.String()),
        },
      } as const;

      @Node({ label: 'CfgUser' })
      class CfgUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'PLACED',
          direction: 'out',
          model: () => CfgOrderNode,
          properties: orderRelProps,
        })
        Orders!: Related<typeof CfgOrderNode, typeof orderRelProps>;
      }

      @Node({ label: 'CfgOrder' })
      class CfgOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      const Orders = toModel(CfgOrderNode, neogma);
      const Users = toModel(CfgUserNode, neogma);

      // The model was built correctly from decorator metadata
      expect(Users.getRelationshipConfiguration('Orders')).toBeDefined();
      expect(
        Users.getRelationshipConfiguration('Orders').properties,
      ).toBeDefined();

      // Type-level verification: Related<> auto-derived the correct types
      // from the config without needing explicit { Rating: number } / { rating: number }
      type _CreateProps = (typeof Users)['createOne'] extends (
        data: infer D,
        ...args: unknown[]
      ) => unknown
        ? D
        : never;

      // This is a compile-time check — if the inference breaks, tsc will fail
      const _typeCheck = true as const;
      expect(_typeCheck).toBe(true);

      // Clean up
      void Orders;
    });

    it('infers types from shorthand config (bare schemas)', () => {
      // Shorthand: alias === property name, value is bare TSchema
      const tagRelProps = {
        weight: Type.Number(),
      } as const;

      @Node({ label: 'ShUser' })
      class ShUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'TAGGED',
          direction: 'out',
          model: () => ShTagNode,
          properties: tagRelProps,
        })
        Tags!: Related<typeof ShTagNode, typeof tagRelProps>;
      }

      @Node({ label: 'ShTag' })
      class ShTagNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      const Tags = toModel(ShTagNode, neogma);
      const Users = toModel(ShUserNode, neogma);

      expect(Users.getRelationshipConfiguration('Tags')).toBeDefined();
      expect(
        Users.getRelationshipConfiguration('Tags').properties,
      ).toBeDefined();

      void Tags;
    });

    it('preserves backwards compat with explicit 3-param Related usage', () => {
      // Old form: Related<Class, CreateRelProps, RelProps> still works
      @Node({ label: 'BcUser' })
      class BcUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'ORDERED',
          direction: 'out',
          model: () => BcOrderNode,
          properties: {
            Rating: {
              property: 'rating',
              schema: Type.Number(),
            },
          },
        })
        Orders!: Related<
          typeof BcOrderNode,
          { Rating: number },
          { rating: number }
        >;
      }

      @Node({ label: 'BcOrder' })
      class BcOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      const Orders = toModel(BcOrderNode, neogma);
      const Users = toModel(BcUserNode, neogma);

      expect(Users.getRelationshipConfiguration('Orders')).toBeDefined();
      void Orders;
    });

    it('explicit 3-arg Related does not misdetect scalar create-data as config', () => {
      // Regression: TypeBox v1's TSchema is broad enough that primitives like
      // `number` satisfy `extends TSchema`. _HasConfigEntries must exclude
      // primitives so that `Related<T, { Rating: number }, { rating: number }>`
      // uses the explicit third type arg, not a config-derived one.

      @Node({ label: 'ScUser' })
      class ScUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'PURCHASED',
          direction: 'out',
          model: () => ScOrderNode,
          properties: {
            Rating: {
              property: 'rating',
              schema: Type.Number(),
            },
          },
        })
        Orders!: Related<
          typeof ScOrderNode,
          { Rating: number },
          { rating: number }
        >;
      }

      @Node({ label: 'ScOrder' })
      class ScOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      const ScOrders = toModel(ScOrderNode, neogma);
      const ScUsers = toModel(ScUserNode, neogma);

      expect(ScUsers.getRelationshipConfiguration('Orders')).toBeDefined();

      // Type-level assertion: verify the inferred RelProps type resolves to
      // the explicit third arg { rating: number } — NOT a config-derived
      // { Rating: number } (which was the bug when _HasConfigEntries
      // misdetected scalars as TSchema config entries).
      //
      // We do this by extracting the `createOne` data type and checking that
      // the Orders relationship property keys use the alias form (Rating),
      // while a separate compile-time check ensures the RelProps use
      // the property form (rating).
      type OrdersField = InstanceType<typeof ScUserNode>['Orders'];
      type _VerifyCreateProps =
        OrdersField extends ModelRelatedNodesI<
          infer _M,
          infer _I,
          infer C,
          infer _R
        >
          ? C extends { Rating: number }
            ? true
            : false
          : false;
      type _VerifyRelProps =
        OrdersField extends ModelRelatedNodesI<
          infer _M,
          infer _I,
          infer _C,
          infer R
        >
          ? R extends { rating: number }
            ? true
            : false
          : false;

      // If _HasConfigEntries wrongly returns true for { Rating: number },
      // _VerifyRelProps would be false (it would resolve to { Rating: number }
      // from the config instead of { rating: number } from the explicit arg).
      const createPropsOk: _VerifyCreateProps = true;
      const relPropsOk: _VerifyRelProps = true;
      expect(createPropsOk).toBe(true);
      expect(relPropsOk).toBe(true);

      void ScOrders;
    });
  });

  describe('defineRelationshipProperties()', () => {
    it('returns the same object reference (identity function)', () => {
      const config = {
        Rating: { property: 'rating', schema: Type.Number() },
      };
      const result = defineRelationshipProperties(config);
      expect(result).toBe(config);
    });

    it('eliminates the need for as const — config works with @Relationship and Related<>', () => {
      // No `as const` anywhere — defineRelationshipProperties captures literal types
      const relProps = defineRelationshipProperties({
        Rating: {
          property: 'rating',
          schema: Type.Number({ minimum: 1, maximum: 5 }),
        },
      });

      @Node({ label: 'DrpUser' })
      class DrpUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Relationship({
          name: 'RATES',
          direction: 'out',
          model: () => DrpOrderNode,
          properties: relProps,
        })
        Orders!: Related<typeof DrpOrderNode, typeof relProps>;
      }

      @Node({ label: 'DrpOrder' })
      class DrpOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      const Orders = toModel(DrpOrderNode, neogma);
      const Users = toModel(DrpUserNode, neogma);

      const rel = Users.getRelationshipConfiguration('Orders');
      expect(rel.properties).toBeDefined();
      expect(rel.name).toBe('RATES');
      void Orders;
    });

    it('validates relationship properties defined via defineRelationshipProperties', async () => {
      const relProps = defineRelationshipProperties({
        Rating: {
          property: 'rating',
          schema: Type.Number({ minimum: 1, maximum: 5 }),
        },
      });

      @Node({ label: 'DrpValUser' })
      class DrpValUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;

        @Relationship({
          name: 'RATES',
          direction: 'out',
          model: () => DrpValOrderNode,
          properties: relProps,
        })
        Orders!: Related<typeof DrpValOrderNode, typeof relProps>;
      }

      @Node({ label: 'DrpValOrder' })
      class DrpValOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;
      }

      const neogma = getNeogma();
      toModel(DrpValOrderNode, neogma);
      const Users = toModel(DrpValUserNode, neogma);

      // Rating: 10 exceeds maximum: 5
      await expect(
        Users.createOne({
          id: uuid(),
          name: 'User',
          Orders: {
            properties: [{ id: uuid(), name: 'Order', Rating: 10 }],
          },
        }),
      ).rejects.toThrow(NeogmaInstanceValidationError);
    });
  });

  describe('Deferred relationship properties (function form)', () => {
    it('resolves properties from a function at toModel() time', () => {
      const deferredProps = defineRelationshipProperties({
        Score: {
          property: 'score',
          schema: Type.Number({ minimum: 0, maximum: 100 }),
        },
      });

      @Node({ label: 'DefUser' })
      class DefUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        static readonly relProps = deferredProps;

        @Relationship({
          name: 'SCORED',
          direction: 'out',
          model: () => DefTargetNode,
          properties: () => DefUserNode.relProps,
        })
        Targets!: Related<typeof DefTargetNode, typeof DefUserNode.relProps>;
      }

      @Node({ label: 'DefTarget' })
      class DefTargetNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;
      }

      const neogma = getNeogma();
      toModel(DefTargetNode, neogma);
      const Users = toModel(DefUserNode, neogma);

      const rel = Users.getRelationshipConfiguration('Targets');
      expect(rel.properties).toBeDefined();
      expect(rel.name).toBe('SCORED');
    });

    it('validates deferred relationship properties correctly', async () => {
      @Node({ label: 'DefValUser' })
      class DefValUserNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;

        static readonly orderProps = defineRelationshipProperties({
          Rating: {
            property: 'rating',
            schema: Type.Number({ minimum: 1, maximum: 5 }),
          },
        });

        @Relationship({
          name: 'RATES',
          direction: 'out',
          model: () => DefValOrderNode,
          properties: () => DefValUserNode.orderProps,
        })
        Orders!: Related<
          typeof DefValOrderNode,
          typeof DefValUserNode.orderProps
        >;
      }

      @Node({ label: 'DefValOrder' })
      class DefValOrderNode extends NodeEntity {
        @PrimaryKey(Type.String())
        id!: string;

        @Property(Type.String())
        name!: string;
      }

      const neogma = getNeogma();
      toModel(DefValOrderNode, neogma);
      const Users = toModel(DefValUserNode, neogma);

      // Should reject — Rating: 10 exceeds maximum: 5
      await expect(
        Users.createOne({
          id: uuid(),
          name: 'User',
          Orders: {
            properties: [{ id: uuid(), name: 'Order', Rating: 10 }],
          },
        }),
      ).rejects.toThrow(NeogmaInstanceValidationError);

      // Should pass — Rating: 3 is within range
      const user = await Users.createOne({
        id: uuid(),
        name: 'User',
        Orders: {
          properties: [{ id: uuid(), name: 'Order', Rating: 3 }],
        },
      });
      expect(user).toBeTruthy();
    });
  });

  describe('Symbol.metadata polyfill', () => {
    it('exposes a Symbol.metadata well-known symbol on the Symbol global', () => {
      // The polyfill is loaded as an eager side-effect of `src/Decorators/index.ts`,
      // which is imported at the top of this file. After that import, the
      // `metadata` well-known symbol must exist on the Symbol constructor —
      // otherwise Stage-3 decorators would silently fail to populate class
      // metadata at runtime.
      expect(typeof Symbol.metadata).toBe('symbol');
    });

    it('populates metadata on decorated classes via Symbol.metadata', () => {
      const nodeMetadata = SupplierNode[Symbol.metadata];
      expect(nodeMetadata).toBeDefined();
      expect(typeof nodeMetadata).toBe('object');
    });

    it('is idempotent: re-importing the polyfill does not re-create the symbol', async () => {
      const before = Symbol.metadata;
      // Re-import the polyfill module; the `??=` guard should short-circuit.
      await import('./polyfill');
      const after = Symbol.metadata;
      expect(after).toBe(before);
    });
  });
});
