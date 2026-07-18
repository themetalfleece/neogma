/**
 * Tests for legacy (experimental) decorator implementations.
 *
 * Since the test suite's tsconfig uses TC39 decorators (esnext.decorators in
 * lib, no experimentalDecorators), we can't use `@Decorator` syntax for legacy
 * decorators here. Instead, we call the decorator functions programmatically —
 * this is exactly what TypeScript's experimentalDecorators output does at
 * runtime (call the decorator function with target + propertyKey).
 */
import { randomUUID as uuid } from 'crypto';
import Type from 'typebox';

import {
  NeogmaInstanceValidationError,
  NeogmaModelSchemaError,
} from '../../Errors';
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '../../ModelFactory';
import { closeNeogma, getNeogma } from '../../ModelFactory/testHelpers';
import { NodeEntity } from '../NodeEntity';
import { clearModelRegistry, toModel } from '../toModel';
import { Node } from './Node';
import { PrimaryKey } from './PrimaryKey';
import { Property } from './Property';
import { Relationship } from './Relationship';

// ============ Helper: apply legacy decorators programmatically ============
// This simulates what TypeScript's experimentalDecorators output does:
//   __decorate([Property(schema)], Target.prototype, "fieldName", void 0);
//   Target = __decorate([Node(options)], Target);

function applyPropertyDecorator(
  target: abstract new (...args: any[]) => any,
  propertyKey: string,
  decoratorFn: (target: object, key: string) => void,
) {
  decoratorFn(target.prototype, propertyKey);
}

function applyClassDecorator<T extends abstract new (...args: any[]) => any>(
  target: T,
  decoratorFn: (t: T) => T,
): T {
  return decoratorFn(target);
}

// ============ Type definitions ============

type LegacySupplierAttrs = {
  name: string;
  id: string;
  country?: string;
};

type LegacyOrderAttrs = {
  name: string;
  id: string;
  status?: string;
};
type LegacyOrdersInstance = NeogmaInstance<LegacyOrderAttrs, object, object>;
type LegacyOrdersModel = NeogmaModel<LegacyOrderAttrs, object, object, object>;

type LegacyUserAttrs = {
  name: string;
  age?: number;
  id: string;
};
interface LegacyUsersRelated {
  Orders: ModelRelatedNodesI<
    LegacyOrdersModel,
    LegacyOrdersInstance,
    { Rating: number },
    { rating: number }
  >;
}
interface LegacyUsersStatics {
  foo: () => string;
}

// ============ Class definitions with programmatic legacy decorators ============

function createSupplierClass() {
  class SupplierNode extends NodeEntity {
    name!: string;
    id!: string;
    country?: string;
  }
  applyPropertyDecorator(
    SupplierNode,
    'name',
    Property(Type.String({ minLength: 3 })),
  );
  applyPropertyDecorator(SupplierNode, 'id', PrimaryKey(Type.String()));
  applyPropertyDecorator(
    SupplierNode,
    'country',
    Property(Type.Optional(Type.String())),
  );
  return applyClassDecorator(SupplierNode, Node({ label: 'LegacySupplier' }));
}

function createOrderClass() {
  class OrderNode extends NodeEntity {
    name!: string;
    id!: string;
    status?: string;
  }
  applyPropertyDecorator(
    OrderNode,
    'name',
    Property(Type.String({ minLength: 3 })),
  );
  applyPropertyDecorator(OrderNode, 'id', PrimaryKey(Type.String()));
  applyPropertyDecorator(
    OrderNode,
    'status',
    Property(Type.Optional(Type.String())),
  );
  return applyClassDecorator(OrderNode, Node({ label: 'LegacyOrder' }));
}

function createUserClass(OrderNodeRef: abstract new (...args: any[]) => any) {
  class UserNode extends NodeEntity {
    name!: string;
    age?: number;
    id!: string;
    Orders!: any;

    static foo() {
      return 'foo';
    }

    greet(this: { name: string }): string {
      return `hello ${this.name}`;
    }
  }
  applyPropertyDecorator(
    UserNode,
    'name',
    Property(Type.String({ minLength: 3 })),
  );
  applyPropertyDecorator(
    UserNode,
    'age',
    Property(Type.Optional(Type.Number({ minimum: 0 }))),
  );
  applyPropertyDecorator(UserNode, 'id', PrimaryKey(Type.String()));
  applyPropertyDecorator(
    UserNode,
    'Orders',
    Relationship({
      name: 'CREATES',
      direction: 'out',
      model: () => OrderNodeRef as any,
      properties: {
        Rating: {
          property: 'rating',
          schema: Type.Number({ minimum: 1, maximum: 5 }),
        },
      },
    }),
  );
  return applyClassDecorator(UserNode, Node({ label: 'LegacyUser' }));
}

function createTagClass() {
  class TagNode extends NodeEntity {
    id!: string;
    name!: string;
  }
  applyPropertyDecorator(TagNode, 'id', Property());
  applyPropertyDecorator(TagNode, 'name', Property());
  return applyClassDecorator(
    TagNode,
    Node({ label: ['LegacyTag', 'LegacyLabel'] }),
  );
}

function createCategoryClass() {
  class CategoryNode extends NodeEntity {
    id!: string;
    name!: string;
    Parent!: any;
    Siblings!: any;
  }
  applyPropertyDecorator(CategoryNode, 'id', PrimaryKey(Type.String()));
  applyPropertyDecorator(CategoryNode, 'name', Property(Type.String()));
  applyPropertyDecorator(
    CategoryNode,
    'Parent',
    Relationship({ name: 'PARENT_OF', direction: 'in', model: 'self' }),
  );
  applyPropertyDecorator(
    CategoryNode,
    'Siblings',
    Relationship({ name: 'SIBLING_OF', direction: 'none', model: 'self' }),
  );
  return applyClassDecorator(CategoryNode, Node({ label: 'LegacyCategory' }));
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

describe('Legacy decorator-based model creation', () => {
  describe('toModel basic functionality', () => {
    it('creates a model from a legacy-decorated class', () => {
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
      expect(Suppliers).toBeTruthy();
      expect(Suppliers.getModelName()).toBe('LegacySupplier');
      expect(Suppliers.getPrimaryKeyField()).toBe('id');
    });

    it('returns correct labels', () => {
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
      expect(Suppliers.getRawLabels()).toEqual(['LegacySupplier']);
      expect(Suppliers.getLabel()).toBeDefined();
    });

    it('extracts static methods from the class', () => {
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());
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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);

      // Register UserNode BEFORE OrderNode
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());
      const Orders = toModel<LegacyOrderAttrs>(OrderNode, getNeogma());

      const usersOrdersRel = Users.getRelationshipConfiguration('Orders');
      expect(usersOrdersRel.model).toBe(Orders);
    });
  });

  describe('has all NeogmaModel methods', () => {
    it('has all standard static methods', () => {
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
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
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
      const supplier = Suppliers.build({ id: uuid(), name: 'ab' });

      await expect(supplier.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });

    it('passes validation for valid data', async () => {
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
      const supplier = Suppliers.build({ id: uuid(), name: 'Valid Name' });

      await expect(supplier.validate()).resolves.not.toThrow();
    });

    it('throws on invalid type', async () => {
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const SupplierNode = createSupplierClass();
      const Suppliers = toModel<LegacySupplierAttrs>(SupplierNode, getNeogma());
      expect(Suppliers.getModelName()).toBe('LegacySupplier');
    });

    it('clearModelRegistry resets the registry and pending resolutions', () => {
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyUserAttrs, LegacyUsersRelated, LegacyUsersStatics>(
        UserNode,
        getNeogma(),
      );
      clearModelRegistry();

      const OrderNode2 = createOrderClass();
      const UserNode2 = createUserClass(OrderNode2);
      expect(() => {
        toModel<LegacyOrderAttrs>(OrderNode2, getNeogma());
        toModel<LegacyUserAttrs, LegacyUsersRelated, LegacyUsersStatics>(
          UserNode2,
          getNeogma(),
        );
      }).not.toThrow();
    });
  });

  describe('Circular relationships', () => {
    function createCircularClasses() {
      class CircANode extends NodeEntity {
        id!: string;
        B!: any;
      }
      class CircBNode extends NodeEntity {
        id!: string;
        A!: any;
      }

      applyPropertyDecorator(CircANode, 'id', PrimaryKey(Type.String()));
      applyPropertyDecorator(
        CircANode,
        'B',
        Relationship({
          name: 'A_TO_B',
          direction: 'out',
          model: () => CircBNode as any,
        }),
      );
      const A = applyClassDecorator(CircANode, Node({ label: 'LegacyCircA' }));

      applyPropertyDecorator(CircBNode, 'id', PrimaryKey(Type.String()));
      applyPropertyDecorator(
        CircBNode,
        'A',
        Relationship({
          name: 'B_TO_A',
          direction: 'out',
          model: () => CircANode as any,
        }),
      );
      const B = applyClassDecorator(CircBNode, Node({ label: 'LegacyCircB' }));

      return { A, B };
    }

    it('resolves circular deps when A is declared before B', () => {
      const { A: CircANode, B: CircBNode } = createCircularClasses();
      const A = toModel(CircANode, getNeogma());
      const B = toModel(CircBNode, getNeogma());

      const aToB = A.getRelationshipConfiguration('B' as any);
      const bToA = B.getRelationshipConfiguration('A' as any);

      expect(aToB.model).toBe(B);
      expect(bToA.model).toBe(A);
    });

    it('resolves circular deps when B is declared before A', () => {
      const { A: CircANode, B: CircBNode } = createCircularClasses();
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
      const OrderNode = createOrderClass();
      const UserNode = createUserClass(OrderNode);
      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Users = toModel<
        LegacyUserAttrs,
        LegacyUsersRelated,
        LegacyUsersStatics
      >(UserNode, getNeogma());

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
      const TagNode = createTagClass();
      const Tags = toModel(TagNode, getNeogma());
      expect(Tags.getRawLabels()).toEqual(['LegacyTag', 'LegacyLabel']);
    });

    it('does not require a primaryKeyField', () => {
      const TagNode = createTagClass();
      const Tags = toModel(TagNode, getNeogma());
      expect(Tags.getPrimaryKeyField()).toBeNull();
    });
  });

  describe('Properties without TypeBox schemas', () => {
    it('still tracks the property keys (no validator installed)', async () => {
      const TagNode = createTagClass();
      const Tags = toModel(TagNode, getNeogma());
      const tag = Tags.build({ id: uuid(), name: 'Featured' });
      await expect(tag.validate()).resolves.not.toThrow();
    });
  });

  describe('Self-referencing relationships', () => {
    it('accepts model: "self" with direction "in" and "none"', () => {
      const CategoryNode = createCategoryClass();
      type LegacyCategoryAttrs = { id: string; name: string };
      interface LegacyCategoryRelated {
        Parent: ModelRelatedNodesI<any, any>;
        Siblings: ModelRelatedNodesI<any, any>;
      }
      const Categories = toModel<LegacyCategoryAttrs, LegacyCategoryRelated>(
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
      class PKNode extends NodeEntity {
        id!: string;
        name!: string;
      }
      applyPropertyDecorator(PKNode, 'id', PrimaryKey(Type.String()));
      applyPropertyDecorator(PKNode, 'name', Property(Type.String()));
      const PKNodeDecorated = applyClassDecorator(
        PKNode,
        Node({ label: 'LegacyPKUser' }),
      );

      const Model = toModel(PKNodeDecorated, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('id');
    });

    it('auto-registers as @Property without explicit @Property', () => {
      class PKAutoNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(PKAutoNode, 'id', PrimaryKey());
      const PKAutoDecorated = applyClassDecorator(
        PKAutoNode,
        Node({ label: 'LegacyPKAuto' }),
      );

      // Should NOT throw — @PrimaryKey auto-registers as @Property
      const Model = toModel(PKAutoDecorated, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('id');
    });

    it('throws when @PrimaryKey is applied to two fields', () => {
      class PKDupNode extends NodeEntity {
        id!: string;
        uuid!: string;
      }
      applyPropertyDecorator(PKDupNode, 'id', PrimaryKey());
      expect(() => {
        applyPropertyDecorator(PKDupNode, 'uuid', PrimaryKey());
      }).toThrow(NeogmaModelSchemaError);
    });

    it('works on a non-id field', () => {
      class PKEmailNode extends NodeEntity {
        email!: string;
        name!: string;
      }
      applyPropertyDecorator(PKEmailNode, 'email', PrimaryKey(Type.String()));
      applyPropertyDecorator(PKEmailNode, 'name', Property(Type.String()));
      const PKEmailDecorated = applyClassDecorator(
        PKEmailNode,
        Node({ label: 'LegacyPKEmail' }),
      );

      const Model = toModel(PKEmailDecorated, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('email');
    });

    it('does not duplicate @Property when stacked with @Property (backwards compat)', () => {
      class PKStackedNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(PKStackedNode, 'id', Property(Type.String()));
      applyPropertyDecorator(PKStackedNode, 'id', PrimaryKey(Type.String()));
      const PKStackedDecorated = applyClassDecorator(
        PKStackedNode,
        Node({ label: 'LegacyPKStacked' }),
      );

      // Should not throw — @PrimaryKey skips property registration when
      // @Property already registered the field.
      const Model = toModel(PKStackedDecorated, getNeogma());
      expect(Model.getPrimaryKeyField()).toBe('id');
    });
  });

  describe('@PrimaryKey schema validation', () => {
    it('rejects invalid values via schema', async () => {
      class PKSchemaNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(
        PKSchemaNode,
        'id',
        PrimaryKey(Type.String({ minLength: 5 })),
      );
      const PKSchemaDecorated = applyClassDecorator(
        PKSchemaNode,
        Node({ label: 'LegacyPKSchemaReject' }),
      );

      const Model = toModel(PKSchemaDecorated, getNeogma());
      const instance = Model.build({ id: 'ab' });
      // minLength: 5 should be enforced
      await expect(instance.validate()).rejects.toThrow(
        NeogmaInstanceValidationError,
      );
    });

    it('passes validation when value satisfies schema', async () => {
      class PKSchemaPassNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(
        PKSchemaPassNode,
        'id',
        PrimaryKey(Type.String({ minLength: 5 })),
      );
      const PKSchemaPassDecorated = applyClassDecorator(
        PKSchemaPassNode,
        Node({ label: 'LegacyPKSchemaPass' }),
      );

      const Model = toModel(PKSchemaPassDecorated, getNeogma());
      const instance = Model.build({ id: 'abcdef' });
      await expect(instance.validate()).resolves.toBeUndefined();
    });
  });

  describe('Optional @Node label', () => {
    it('infers label from class name when label is omitted', () => {
      class LegacyInferredNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(
        LegacyInferredNode,
        'id',
        PrimaryKey(Type.String()),
      );
      const InferredDecorated = applyClassDecorator(
        LegacyInferredNode,
        Node(),
      );

      const Model = toModel(InferredDecorated, getNeogma());
      expect(Model.getModelName()).toBe('LegacyInferredNode');
      expect(Model.getRawLabels()).toEqual(['LegacyInferredNode']);
    });

    it('uses explicit label when provided', () => {
      class LegacyExplicitNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(
        LegacyExplicitNode,
        'id',
        PrimaryKey(Type.String()),
      );
      const ExplicitDecorated = applyClassDecorator(
        LegacyExplicitNode,
        Node({ label: 'CustomLegacyLabel' }),
      );

      const Model = toModel(ExplicitDecorated, getNeogma());
      expect(Model.getModelName()).toBe('CustomLegacyLabel');
    });
  });

  describe('Relationship properties object syntax', () => {
    it('accepts shorthand when alias === property (bare schema)', () => {
      const OrderNode = createOrderClass();

      class ShorthandRelNode extends NodeEntity {
        id!: string;
        name!: string;
        Items!: any;
      }
      applyPropertyDecorator(
        ShorthandRelNode,
        'id',
        PrimaryKey(Type.String()),
      );
      applyPropertyDecorator(
        ShorthandRelNode,
        'name',
        Property(Type.String()),
      );
      applyPropertyDecorator(
        ShorthandRelNode,
        'Items',
        Relationship({
          name: 'HAS_ITEM',
          direction: 'out',
          model: () => OrderNode as any,
          properties: {
            quantity: Type.Number({ minimum: 1 }),
          },
        }),
      );
      const ShorthandDecorated = applyClassDecorator(
        ShorthandRelNode,
        Node({ label: 'LegacyShorthandRel' }),
      );

      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Model = toModel(ShorthandDecorated, getNeogma());
      const rel = Model.getRelationshipConfiguration('Items');
      expect(rel.name).toBe('HAS_ITEM');
      expect(rel.properties).toBeDefined();
    });

    it('accepts array syntax (legacy passthrough)', () => {
      const OrderNode = createOrderClass();

      class ArrayRelNode extends NodeEntity {
        id!: string;
        Items!: any;
      }
      applyPropertyDecorator(ArrayRelNode, 'id', PrimaryKey(Type.String()));
      applyPropertyDecorator(
        ArrayRelNode,
        'Items',
        Relationship({
          name: 'HAS_ITEM',
          direction: 'out',
          model: () => OrderNode as any,
          properties: [
            {
              alias: 'Quantity',
              property: 'quantity',
              schema: Type.Number(),
            },
          ],
        }),
      );
      const ArrayDecorated = applyClassDecorator(
        ArrayRelNode,
        Node({ label: 'LegacyArrayRel' }),
      );

      toModel<LegacyOrderAttrs>(OrderNode, getNeogma());
      const Model = toModel(ArrayDecorated, getNeogma());
      const rel = Model.getRelationshipConfiguration('Items');
      expect(rel.name).toBe('HAS_ITEM');
      expect(rel.properties).toBeDefined();
    });
  });

  describe('Duplicate decorator guard', () => {
    it('throws when @Property is applied twice to the same field', () => {
      class DupNode extends NodeEntity {
        id!: string;
      }
      applyPropertyDecorator(DupNode, 'id', Property(Type.String()));
      expect(() => {
        applyPropertyDecorator(DupNode, 'id', Property(Type.String()));
      }).toThrow(NeogmaModelSchemaError);
    });

    it('throws when @Relationship is applied twice to the same field', () => {
      class DupRelNode extends NodeEntity {
        Rel!: any;
      }
      applyPropertyDecorator(
        DupRelNode,
        'Rel',
        Relationship({ name: 'R', direction: 'out', model: 'self' }),
      );
      expect(() => {
        applyPropertyDecorator(
          DupRelNode,
          'Rel',
          Relationship({ name: 'R', direction: 'out', model: 'self' }),
        );
      }).toThrow(NeogmaModelSchemaError);
    });
  });
});
