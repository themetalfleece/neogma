import { NeogmaConstraintError } from '../../Errors/NeogmaConstraintError';
import { NeogmaError } from '../../Errors/NeogmaError';
import {
  PROTOTYPE_POLLUTION_KEYS,
  RESERVED_INSTANCE_PROPERTIES,
  RESERVED_RELATIONSHIP_ALIASES,
  validateRelationshipAlias,
  validateSchemaPropertyName,
} from './reservedNames';

describe('Reserved Names Validation', () => {
  describe('PROTOTYPE_POLLUTION_KEYS', () => {
    it('should include __proto__, constructor, and prototype', () => {
      expect(PROTOTYPE_POLLUTION_KEYS).toContain('__proto__');
      expect(PROTOTYPE_POLLUTION_KEYS).toContain('constructor');
      expect(PROTOTYPE_POLLUTION_KEYS).toContain('prototype');
    });

    it('should have exactly 3 keys', () => {
      expect(PROTOTYPE_POLLUTION_KEYS.length).toBe(3);
    });
  });

  describe('RESERVED_RELATIONSHIP_ALIASES', () => {
    it('should include node, relationship, and __collected', () => {
      expect(RESERVED_RELATIONSHIP_ALIASES).toContain('node');
      expect(RESERVED_RELATIONSHIP_ALIASES).toContain('relationship');
      expect(RESERVED_RELATIONSHIP_ALIASES).toContain('__collected');
    });

    it('should include prototype pollution keys', () => {
      for (const key of PROTOTYPE_POLLUTION_KEYS) {
        expect(RESERVED_RELATIONSHIP_ALIASES).toContain(key);
      }
    });

    it('should be readonly', () => {
      const aliases: readonly string[] = RESERVED_RELATIONSHIP_ALIASES;
      // 3 original + 3 prototype pollution keys
      expect(aliases.length).toBe(6);
    });
  });

  describe('RESERVED_INSTANCE_PROPERTIES', () => {
    it('should include prototype pollution keys', () => {
      for (const key of PROTOTYPE_POLLUTION_KEYS) {
        expect(RESERVED_INSTANCE_PROPERTIES).toContain(key);
      }
    });

    it('should include internal state properties', () => {
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('__existsInDatabase');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('__relationshipData');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('dataValues');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('changed');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('labels');
    });

    it('should include instance methods', () => {
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('getDataValues');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('save');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('validate');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('updateRelationship');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('delete');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('relateTo');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('findRelationships');
      expect(RESERVED_INSTANCE_PROPERTIES).toContain('deleteRelationships');
    });
  });

  describe('validateRelationshipAlias', () => {
    it('should accept valid aliases', () => {
      expect(() =>
        validateRelationshipAlias('Orders', 'TestModel'),
      ).not.toThrow();
      expect(() =>
        validateRelationshipAlias('Friends', 'TestModel'),
      ).not.toThrow();
      expect(() =>
        validateRelationshipAlias('items_v2', 'TestModel'),
      ).not.toThrow();
    });

    it('should throw NeogmaConstraintError for reserved alias "node"', () => {
      expect(() => validateRelationshipAlias('node', 'TestModel')).toThrow(
        NeogmaConstraintError,
      );
      expect(() => validateRelationshipAlias('node', 'TestModel')).toThrow(
        /reserved/i,
      );
    });

    it('should throw NeogmaConstraintError for reserved alias "relationship"', () => {
      expect(() =>
        validateRelationshipAlias('relationship', 'TestModel'),
      ).toThrow(NeogmaConstraintError);
    });

    it('should throw NeogmaConstraintError for reserved alias "__collected"', () => {
      expect(() =>
        validateRelationshipAlias('__collected', 'TestModel'),
      ).toThrow(NeogmaConstraintError);
    });

    it('should throw NeogmaConstraintError for prototype pollution keys', () => {
      for (const key of PROTOTYPE_POLLUTION_KEYS) {
        expect(() => validateRelationshipAlias(key, 'TestModel')).toThrow(
          NeogmaConstraintError,
        );
      }
    });

    it('should throw NeogmaError for invalid Cypher identifiers', () => {
      expect(() =>
        validateRelationshipAlias('123invalid', 'TestModel'),
      ).toThrow(NeogmaError);
      expect(() => validateRelationshipAlias('has-dash', 'TestModel')).toThrow(
        NeogmaError,
      );
      expect(() => validateRelationshipAlias('has space', 'TestModel')).toThrow(
        NeogmaError,
      );
    });

    it('should include model name in error message', () => {
      try {
        validateRelationshipAlias('node', 'MyModel');
        fail('Expected error to be thrown');
      } catch (err) {
        expect((err as Error).message).toContain('MyModel');
      }
    });
  });

  describe('validateSchemaPropertyName', () => {
    it('should accept valid property names', () => {
      expect(() =>
        validateSchemaPropertyName('name', 'TestModel'),
      ).not.toThrow();
      expect(() =>
        validateSchemaPropertyName('email', 'TestModel'),
      ).not.toThrow();
      expect(() =>
        validateSchemaPropertyName('user_id', 'TestModel'),
      ).not.toThrow();
    });

    it('should throw NeogmaConstraintError for reserved property "save"', () => {
      expect(() => validateSchemaPropertyName('save', 'TestModel')).toThrow(
        NeogmaConstraintError,
      );
      expect(() => validateSchemaPropertyName('save', 'TestModel')).toThrow(
        /reserved/i,
      );
    });

    it('should throw NeogmaConstraintError for reserved property "delete"', () => {
      expect(() => validateSchemaPropertyName('delete', 'TestModel')).toThrow(
        NeogmaConstraintError,
      );
    });

    it('should throw NeogmaConstraintError for reserved property "dataValues"', () => {
      expect(() =>
        validateSchemaPropertyName('dataValues', 'TestModel'),
      ).toThrow(NeogmaConstraintError);
    });

    it('should throw NeogmaConstraintError for all reserved properties', () => {
      for (const reserved of RESERVED_INSTANCE_PROPERTIES) {
        expect(() => validateSchemaPropertyName(reserved, 'TestModel')).toThrow(
          NeogmaConstraintError,
        );
      }
    });

    it('should throw NeogmaConstraintError for prototype pollution keys', () => {
      for (const key of PROTOTYPE_POLLUTION_KEYS) {
        expect(() => validateSchemaPropertyName(key, 'TestModel')).toThrow(
          NeogmaConstraintError,
        );
      }
    });

    it('should throw NeogmaError for invalid Cypher identifiers', () => {
      expect(() =>
        validateSchemaPropertyName('123invalid', 'TestModel'),
      ).toThrow(NeogmaError);
      expect(() => validateSchemaPropertyName('has-dash', 'TestModel')).toThrow(
        NeogmaError,
      );
    });

    it('should include model name in error message', () => {
      try {
        validateSchemaPropertyName('save', 'MyModel');
        fail('Expected error to be thrown');
      } catch (err) {
        expect((err as Error).message).toContain('MyModel');
      }
    });
  });
});
