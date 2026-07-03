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
  Node,
  NodeEntity,
  Property,
  Relationship,
  toModel,
} from './index';

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

@Node({ label: 'DecSupplier', primaryKeyField: 'id' })
class SupplierNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  country?: string;
}

@Node({ label: 'DecOrder', primaryKeyField: 'id' })
class OrderNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  status?: string;
}

@Node({ label: 'DecUser', primaryKeyField: 'id' })
class UserNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  age?: number;

  @Property(Type.String())
  id!: string;

  @Relationship({
    name: 'CREATES',
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
@Node({ label: 'DecCategory', primaryKeyField: 'id' })
class CategoryNode extends NodeEntity {
  @Property(Type.String())
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
    @Node({ label: 'DecCircA', primaryKeyField: 'id' })
    class CircANode extends NodeEntity {
      @Property(Type.String())
      id!: string;

      @Relationship({
        name: 'A_TO_B',
        direction: 'out',
        model: () => CircBNode,
      })
      B!: any;
    }

    @Node({ label: 'DecCircB', primaryKeyField: 'id' })
    class CircBNode extends NodeEntity {
      @Property(Type.String())
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
