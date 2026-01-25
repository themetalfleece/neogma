/**
 * Type safety tests for WhereParamsI and related types.
 * These tests verify that the type system catches property name typos
 * and value type mismatches at compile time.
 */
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '../ModelFactory';
import {
  ExtractPropertiesFromInstance,
  Op,
  TypedRelationshipWhereI,
  WhereParamsI,
  WhereValuesI,
} from '.';

// ============ Test Types Setup ============

/** Properties for a User node */
type UserProperties = {
  id: string;
  name: string;
  email: string;
  age?: number;
  isActive: boolean;
};

/** Properties for an Order node */
type OrderProperties = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
};

/** Properties for a User-Order relationship */
type OrderRelationshipProperties = {
  rating: number;
  createdAt: string;
};

/** User instance type */
type UserInstance = NeogmaInstance<UserProperties, UserRelatedNodesI, object>;

/** Order instance type */
type OrderInstance = NeogmaInstance<OrderProperties, object, object>;

/** User related nodes */
interface UserRelatedNodesI {
  Orders: ModelRelatedNodesI<
    NeogmaModel<OrderProperties, object, object, object>,
    OrderInstance,
    { Rating: number },
    OrderRelationshipProperties
  >;
}

// ============ WhereValuesI Tests ============

describe('WhereValuesI type safety', () => {
  describe('string property', () => {
    it('accepts valid string values and operators', () => {
      const direct: WhereValuesI<string> = 'John';
      const array: WhereValuesI<string> = ['John', 'Jane'];
      const opEq: WhereValuesI<string> = { [Op.eq]: 'John' };
      const opIn: WhereValuesI<string> = { [Op.in]: ['John', 'Jane'] };
      const opNe: WhereValuesI<string> = { [Op.ne]: 'Admin' };
      const opContains: WhereValuesI<string> = { [Op.contains]: 'ohn' };

      expect(direct).toBe('John');
      expect(array).toEqual(['John', 'Jane']);
      expect(opEq).toBeDefined();
      expect(opIn).toBeDefined();
      expect(opNe).toBeDefined();
      expect(opContains).toBeDefined();
    });

    it('rejects wrong value types', () => {
      // @ts-expect-error - number is not assignable to string
      const _direct: WhereValuesI<string> = 123;
      // @ts-expect-error - boolean is not assignable to string
      const _bool: WhereValuesI<string> = true;
      // @ts-expect-error - Op.eq expects string, not number
      const _opEq: WhereValuesI<string> = { [Op.eq]: 123 };
      // @ts-expect-error - Op.in expects string[], not number[]
      const _opIn: WhereValuesI<string> = { [Op.in]: [1, 2, 3] };
      // @ts-expect-error - Op.ne expects string, not boolean
      const _opNe: WhereValuesI<string> = { [Op.ne]: false };

      void _direct;
      void _bool;
      void _opEq;
      void _opIn;
      void _opNe;
    });
  });

  describe('number property', () => {
    it('accepts valid number values and operators', () => {
      const direct: WhereValuesI<number> = 25;
      const array: WhereValuesI<number> = [18, 25, 30];
      const opEq: WhereValuesI<number> = { [Op.eq]: 25 };
      const opIn: WhereValuesI<number> = { [Op.in]: [1, 2, 3] };
      const opGt: WhereValuesI<number> = { [Op.gt]: 18 };
      const opGte: WhereValuesI<number> = { [Op.gte]: 21 };
      const opLt: WhereValuesI<number> = { [Op.lt]: 65 };
      const opLte: WhereValuesI<number> = { [Op.lte]: 100 };

      expect(direct).toBe(25);
      expect(array).toEqual([18, 25, 30]);
      expect(opEq).toBeDefined();
      expect(opIn).toBeDefined();
      expect(opGt).toBeDefined();
      expect(opGte).toBeDefined();
      expect(opLt).toBeDefined();
      expect(opLte).toBeDefined();
    });

    it('rejects wrong value types', () => {
      // @ts-expect-error - string is not assignable to number
      const _direct: WhereValuesI<number> = 'twenty-five';
      // @ts-expect-error - boolean is not assignable to number
      const _bool: WhereValuesI<number> = true;
      // @ts-expect-error - Op.gt expects number, not string
      const _opGt: WhereValuesI<number> = { [Op.gt]: '18' };
      // @ts-expect-error - Op.in expects number[], not string[]
      const _opIn: WhereValuesI<number> = { [Op.in]: ['a', 'b'] };

      void _direct;
      void _bool;
      void _opGt;
      void _opIn;
    });
  });

  describe('boolean property', () => {
    it('accepts valid boolean values and operators', () => {
      const direct: WhereValuesI<boolean> = true;
      const opEq: WhereValuesI<boolean> = { [Op.eq]: false };
      const opNe: WhereValuesI<boolean> = { [Op.ne]: true };

      expect(direct).toBe(true);
      expect(opEq).toBeDefined();
      expect(opNe).toBeDefined();
    });

    it('rejects wrong value types', () => {
      // @ts-expect-error - string is not assignable to boolean
      const _string: WhereValuesI<boolean> = 'true';
      // @ts-expect-error - number is not assignable to boolean
      const _number: WhereValuesI<boolean> = 1;
      // @ts-expect-error - Op.eq expects boolean, not string
      const _opEq: WhereValuesI<boolean> = { [Op.eq]: 'true' };

      void _string;
      void _number;
      void _opEq;
    });
  });
});

// ============ WhereParamsI Tests ============

describe('WhereParamsI type safety', () => {
  describe('property name validation', () => {
    it('accepts valid property names', () => {
      const where: WhereParamsI<UserProperties> = {
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 25,
        isActive: true,
      };

      expect(where.id).toBe('123');
      expect(where.name).toBe('John');
    });

    it('accepts partial properties and empty object', () => {
      const partial: WhereParamsI<UserProperties> = { name: 'John' };
      const empty: WhereParamsI<UserProperties> = {};

      expect(partial.name).toBe('John');
      expect(empty).toEqual({});
    });

    it('rejects invalid property names (typos, wrong names, wrong case)', () => {
      // @ts-expect-error - 'nam' is a typo, should be 'name'
      const _typo1: WhereParamsI<UserProperties> = { nam: 'John' };
      // @ts-expect-error - 'naem' is a typo
      const _typo2: WhereParamsI<UserProperties> = { naem: 'John' };
      const _wrong1: WhereParamsI<UserProperties> = {
        // @ts-expect-error - 'emailAddress' is wrong, should be 'email'
        emailAddress: 'test@example.com',
      };
      // @ts-expect-error - 'ID' is wrong case, should be 'id'
      const _case1: WhereParamsI<UserProperties> = { ID: '123' };
      const _nonExistent: WhereParamsI<UserProperties> = {
        // @ts-expect-error - 'nonExistent' does not exist
        nonExistent: 'value',
      };

      void _typo1;
      void _typo2;
      void _wrong1;
      void _case1;
      void _nonExistent;
    });
  });

  describe('value type validation', () => {
    it('accepts correct value types for each property', () => {
      const where: WhereParamsI<UserProperties> = {
        id: '123', // string
        name: 'John', // string
        age: 25, // number
        isActive: true, // boolean
      };

      expect(where.id).toBe('123');
      expect(where.age).toBe(25);
      expect(where.isActive).toBe(true);
    });

    it('rejects wrong value types for properties', () => {
      const _where1: WhereParamsI<UserProperties> = {
        // @ts-expect-error - name expects string, not number
        name: 12345,
      };
      const _where2: WhereParamsI<UserProperties> = {
        // @ts-expect-error - age expects number, not string
        age: 'twenty-five',
      };
      const _where3: WhereParamsI<UserProperties> = {
        // @ts-expect-error - isActive expects boolean, not string
        isActive: 'yes',
      };
      const _where4: WhereParamsI<UserProperties> = {
        // @ts-expect-error - email expects string, not boolean
        email: true,
      };

      void _where1;
      void _where2;
      void _where3;
      void _where4;
    });
  });

  describe('operator value type validation', () => {
    it('accepts operators with correct value types', () => {
      const where: WhereParamsI<UserProperties> = {
        name: { [Op.eq]: 'John' },
        age: { [Op.gte]: 18, [Op.lte]: 65 },
        email: { [Op.in]: ['a@test.com', 'b@test.com'] },
        isActive: { [Op.eq]: true },
      };

      expect(where.name).toBeDefined();
      expect(where.age).toBeDefined();
      expect(where.email).toBeDefined();
      expect(where.isActive).toBeDefined();
    });

    it('rejects operators with wrong value types', () => {
      const _where1: WhereParamsI<UserProperties> = {
        // @ts-expect-error - Op.eq for name expects string, not number
        name: { [Op.eq]: 123 },
      };
      const _where2: WhereParamsI<UserProperties> = {
        // @ts-expect-error - Op.gt for age expects number, not string
        age: { [Op.gt]: '18' },
      };
      const _where3: WhereParamsI<UserProperties> = {
        // @ts-expect-error - Op.in for email expects string[], not number[]
        email: { [Op.in]: [1, 2, 3] },
      };
      const _where4: WhereParamsI<UserProperties> = {
        // @ts-expect-error - Op.eq for isActive expects boolean, not string
        isActive: { [Op.eq]: 'true' },
      };

      void _where1;
      void _where2;
      void _where3;
      void _where4;
    });

    it('rejects operators on invalid property names', () => {
      const _where: WhereParamsI<UserProperties> = {
        // @ts-expect-error - 'ages' is not a valid property
        ages: { [Op.gt]: 18 },
      };

      void _where;
    });
  });

  describe('mixed valid and invalid', () => {
    it('rejects object with one invalid property among valid ones', () => {
      const _where: WhereParamsI<UserProperties> = {
        name: 'John', // valid
        age: 25, // valid
        // @ts-expect-error - 'invalidProp' is not valid
        invalidProp: 'value',
      };

      void _where;
    });

    it('rejects object with valid property name but wrong value type', () => {
      const _where: WhereParamsI<UserProperties> = {
        name: 'John', // valid
        // @ts-expect-error - age has correct name but wrong type
        age: 'not-a-number',
      };

      void _where;
    });
  });
});

// ============ TypedRelationshipWhereI Tests ============

describe('TypedRelationshipWhereI type safety', () => {
  describe('source property validation', () => {
    it('accepts valid source properties with correct types', () => {
      const where: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        source: {
          id: '123',
          name: 'John',
          age: { [Op.gte]: 18 },
          isActive: true,
        },
      };

      expect(where.source?.id).toBe('123');
    });

    it('rejects invalid source property names', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - 'userName' is not a valid UserProperties field
        source: { userName: 'John' },
      };

      void _invalid;
    });

    it('rejects wrong value types for source properties', () => {
      const _invalid1: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - name expects string, not number
        source: { name: 12345 },
      };
      const _invalid2: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - age expects number, not string
        source: { age: 'twenty' },
      };
      const _invalid3: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - Op.gte for age expects number
        source: { age: { [Op.gte]: '18' } },
      };

      void _invalid1;
      void _invalid2;
      void _invalid3;
    });
  });

  describe('target property validation', () => {
    it('accepts valid target properties with correct types', () => {
      const where: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        target: {
          id: '456',
          orderNumber: 'ORD-123',
          total: { [Op.gt]: 100 },
          status: { [Op.in]: ['pending', 'completed'] },
        },
      };

      expect(where.target?.orderNumber).toBe('ORD-123');
    });

    it('rejects invalid target property names', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - 'orderId' is not a valid OrderProperties field
        target: { orderId: '456' },
      };

      void _invalid;
    });

    it('rejects source properties used on target', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - 'name' is a UserProperties field, not OrderProperties
        target: { name: 'John' },
      };

      void _invalid;
    });

    it('rejects wrong value types for target properties', () => {
      const _invalid1: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - orderNumber expects string, not number
        target: { orderNumber: 123 },
      };
      const _invalid2: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - total expects number, not string
        target: { total: '100.50' },
      };
      const _invalid3: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - Op.gt for total expects number
        target: { total: { [Op.gt]: '100' } },
      };

      void _invalid1;
      void _invalid2;
      void _invalid3;
    });
  });

  describe('relationship property validation', () => {
    it('accepts valid relationship properties with correct types', () => {
      const where: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        relationship: {
          rating: 5,
          createdAt: '2024-01-01',
        },
      };

      expect(where.relationship?.rating).toBe(5);
    });

    it('accepts operators with correct types on relationship', () => {
      const where: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        relationship: {
          rating: { [Op.gte]: 4 },
          createdAt: { [Op.contains]: '2024' },
        },
      };

      expect(where.relationship).toBeDefined();
    });

    it('rejects invalid relationship property names', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - 'score' is not a valid relationship property
        relationship: { score: 10 },
      };

      void _invalid;
    });

    it('rejects node properties used on relationship', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - 'name' is a node property, not a relationship property
        relationship: { name: 'John' },
      };

      void _invalid;
    });

    it('rejects wrong value types for relationship properties', () => {
      const _invalid1: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - rating expects number, not string
        relationship: { rating: 'five' },
      };
      const _invalid2: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - createdAt expects string, not number
        relationship: { createdAt: 20240101 },
      };
      const _invalid3: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        // @ts-expect-error - Op.gte for rating expects number
        relationship: { rating: { [Op.gte]: '4' } },
      };

      void _invalid1;
      void _invalid2;
      void _invalid3;
    });
  });

  describe('combined source, target, and relationship', () => {
    it('accepts valid properties for all three with correct types', () => {
      const where: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        source: { name: 'John', age: { [Op.gte]: 18 } },
        target: { orderNumber: 'ORD-123', total: { [Op.gt]: 50 } },
        relationship: { rating: { [Op.gte]: 4 } },
      };

      expect(where.source?.name).toBe('John');
      expect(where.target?.orderNumber).toBe('ORD-123');
      expect(where.relationship).toBeDefined();
    });

    it('rejects mixed invalid property names across levels', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        source: { name: 'John' }, // valid
        // @ts-expect-error - 'invalidTarget' is not a valid property
        target: { invalidTarget: 'value' },
        relationship: { rating: 5 }, // valid
      };

      void _invalid;
    });

    it('rejects mixed invalid value types across levels', () => {
      const _invalid: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      > = {
        source: { name: 'John' }, // valid
        // @ts-expect-error - total expects number, not string
        target: { total: 'expensive' },
        relationship: { rating: 5 }, // valid
      };

      void _invalid;
    });
  });
});

// ============ ExtractPropertiesFromInstance Tests ============

describe('ExtractPropertiesFromInstance type safety', () => {
  it('extracts properties from NeogmaInstance type', () => {
    type ExtractedUser = ExtractPropertiesFromInstance<UserInstance>;

    const user: ExtractedUser = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      isActive: true,
    };

    expect(user.id).toBe('123');
  });

  it('passes through plain object types', () => {
    type PlainObject = { foo: string; bar: number };
    type Extracted = ExtractPropertiesFromInstance<PlainObject>;

    const obj: Extracted = { foo: 'hello', bar: 42 };

    expect(obj.foo).toBe('hello');
  });
});

// ============ Assignability Tests ============

describe('type assignability', () => {
  it('WhereParamsI is assignable to WhereParamsI', () => {
    const typed: WhereParamsI<UserProperties> = {
      name: 'John',
      age: 25,
    };

    const untyped: WhereParamsI = typed;

    expect(untyped.name).toBe('John');
  });

  it('documents that WhereParamsI allows arbitrary properties', () => {
    const untyped: WhereParamsI = {
      name: 'John',
      anyProp: 'allowed', // WhereParamsI allows any string key
    };

    // When assigning to WhereParamsI, only known properties are type-checked
    const typed: WhereParamsI<UserProperties> = untyped;

    expect(typed.name).toBe('John');
  });
});

// ============ Real-world Usage Pattern Tests ============

describe('real-world usage patterns', () => {
  describe('findMany simulation', () => {
    type FindManyParams = {
      where?: WhereParamsI<UserProperties>;
      limit?: number;
    };

    it('accepts valid where with correct types', () => {
      const params: FindManyParams = {
        where: { name: 'John', age: { [Op.gte]: 18 } },
        limit: 10,
      };

      expect(params.where?.name).toBe('John');
    });

    it('rejects invalid property name', () => {
      const _params: FindManyParams = {
        where: {
          // @ts-expect-error - 'userName' is not a valid property
          userName: 'John',
        },
      };

      void _params;
    });

    it('rejects wrong value type', () => {
      const _params: FindManyParams = {
        where: {
          // @ts-expect-error - age expects number, not string
          age: 'eighteen',
        },
      };

      void _params;
    });
  });

  describe('findRelationships simulation', () => {
    type FindRelationshipsParams = {
      alias: 'Orders';
      where?: TypedRelationshipWhereI<
        UserProperties,
        OrderInstance,
        OrderRelationshipProperties
      >;
    };

    it('accepts valid where with correct types at all levels', () => {
      const params: FindRelationshipsParams = {
        alias: 'Orders',
        where: {
          source: { name: 'John' },
          target: { orderNumber: 'ORD-123' },
          relationship: { rating: { [Op.gte]: 4 } },
        },
      };

      expect(params.where?.source?.name).toBe('John');
    });

    it('rejects invalid property at source level', () => {
      const _params: FindRelationshipsParams = {
        alias: 'Orders',
        where: {
          // @ts-expect-error - 'userName' is not valid
          source: { userName: 'John' },
        },
      };

      void _params;
    });

    it('rejects wrong type at target level', () => {
      const _params: FindRelationshipsParams = {
        alias: 'Orders',
        where: {
          // @ts-expect-error - total expects number
          target: { total: 'expensive' },
        },
      };

      void _params;
    });

    it('rejects wrong operator type at relationship level', () => {
      const _params: FindRelationshipsParams = {
        alias: 'Orders',
        where: {
          // @ts-expect-error - Op.gte for rating expects number
          relationship: { rating: { [Op.gte]: '4' } },
        },
      };

      void _params;
    });
  });

  describe('original GitHub issue reproduction', () => {
    type FindRelationshipsParams = {
      alias: 'Group';
      where?: {
        target?: WhereParamsI<{ groupName: string; id: string }>;
      };
    };

    it('rejects typo grpName instead of groupName', () => {
      const _params: FindRelationshipsParams = {
        alias: 'Group',
        where: {
          target: {
            // @ts-expect-error - 'grpName' is not valid, should be 'groupName'
            grpName: 'Administrators',
          },
        },
      };

      void _params;
    });

    it('accepts correct property name groupName', () => {
      const validParams: FindRelationshipsParams = {
        alias: 'Group',
        where: { target: { groupName: 'Administrators' } },
      };

      expect(validParams.where?.target?.groupName).toBe('Administrators');
    });
  });
});
