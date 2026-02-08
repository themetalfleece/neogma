import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import {
  assertCreateMultiple,
  assertCreateRelated,
  assertDeleteWithIdentifier,
  assertDeleteWithLiteral,
  assertMatchLiteral,
  assertMatchMultiple,
  assertMatchRelated,
  assertNodeWithLabel,
  assertNodeWithModel,
  assertNodeWithProperties,
  assertNodeWithWhere,
  assertOnCreateSetValue,
  assertOnMatchSetValue,
  assertRelationshipWithProperties,
  assertRelationshipWithWhere,
  assertRemoveLabels,
  assertRemoveProperties,
  assertReturnObject,
  assertReturnValue,
  assertSetValue,
  isCreateMultiple,
  isCreateRelated,
  isDeleteWithIdentifier,
  isDeleteWithLiteral,
  isMatchLiteral,
  isMatchMultiple,
  isMatchRelated,
  isNodeWithLabel,
  isNodeWithModel,
  isNodeWithProperties,
  isNodeWithWhere,
  isOnCreateSetParameter,
  isOnMatchSetParameter,
  isRelationshipWithProperties,
  isRelationshipWithWhere,
  isRemoveLabels,
  isRemoveProperties,
  isReturnObject,
  isReturnParameter,
  isSetParameter,
} from './QueryBuilder.types';

describe('QueryBuilder.types type guards', () => {
  describe('isMatchRelated', () => {
    it('returns false when related key is missing', () => {
      expect(isMatchRelated({})).toBe(false);
    });

    it('returns true for valid array', () => {
      expect(isMatchRelated({ related: [] })).toBe(true);
    });

    it('returns false when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isMatchRelated({ related: 'invalid' })).toBe(false);
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isMatchRelated({ related: 123 })).toBe(false);
    });
  });

  describe('assertMatchRelated', () => {
    it('throws when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertMatchRelated({ related: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertMatchRelated({ related: 123 })).toThrow(
        "Invalid 'related' value",
      );
    });
  });

  describe('isMatchMultiple', () => {
    it('returns false when multiple key is missing', () => {
      expect(isMatchMultiple({})).toBe(false);
    });

    it('returns true for valid array', () => {
      expect(isMatchMultiple({ multiple: [] })).toBe(true);
    });

    it('returns false when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isMatchMultiple({ multiple: 'invalid' })).toBe(false);
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isMatchMultiple({ multiple: {} })).toBe(false);
    });
  });

  describe('assertMatchMultiple', () => {
    it('throws when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertMatchMultiple({ multiple: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertMatchMultiple({ multiple: {} })).toThrow(
        "Invalid 'multiple' value",
      );
    });
  });

  describe('isMatchLiteral', () => {
    it('returns false when literal key is missing', () => {
      expect(isMatchLiteral({})).toBe(false);
    });

    it('returns true for valid non-empty string', () => {
      expect(isMatchLiteral({ literal: '(n)' })).toBe(true);
    });

    it('returns false when literal is empty string', () => {
      expect(isMatchLiteral({ literal: '' })).toBe(false);
    });

    it('returns false when literal is whitespace only', () => {
      expect(isMatchLiteral({ literal: '   ' })).toBe(false);
    });

    it('returns false when literal is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isMatchLiteral({ literal: 123 })).toBe(false);
    });
  });

  describe('assertMatchLiteral', () => {
    it('throws when literal is empty string', () => {
      expect(() => assertMatchLiteral({ literal: '' })).toThrow(
        "Invalid 'literal' value",
      );
    });

    it('throws when literal is whitespace only', () => {
      expect(() => assertMatchLiteral({ literal: '   ' })).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws when literal is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertMatchLiteral({ literal: 123 })).toThrow(
        "Invalid 'literal' value",
      );
    });
  });

  describe('isCreateRelated', () => {
    it('returns false when related key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isCreateRelated({})).toBe(false);
    });

    it('returns true for valid array', () => {
      expect(isCreateRelated({ related: [] })).toBe(true);
    });

    it('returns false when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isCreateRelated({ related: {} })).toBe(false);
    });
  });

  describe('assertCreateRelated', () => {
    it('throws when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertCreateRelated({ related: {} })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isCreateMultiple', () => {
    it('returns false when multiple key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isCreateMultiple({})).toBe(false);
    });

    it('returns true for valid array', () => {
      expect(isCreateMultiple({ multiple: [] })).toBe(true);
    });

    it('returns false when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isCreateMultiple({ multiple: 'invalid' })).toBe(false);
    });
  });

  describe('assertCreateMultiple', () => {
    it('throws when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertCreateMultiple({ multiple: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isDeleteWithIdentifier', () => {
    it('returns false when identifiers key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isDeleteWithIdentifier({})).toBe(false);
    });

    it('returns true for valid string identifier', () => {
      expect(isDeleteWithIdentifier({ identifiers: 'n' })).toBe(true);
    });

    it('returns true for valid array of identifiers', () => {
      expect(isDeleteWithIdentifier({ identifiers: ['n', 'm'] })).toBe(true);
    });

    it('returns false when identifier is empty string', () => {
      expect(isDeleteWithIdentifier({ identifiers: '' })).toBe(false);
    });

    it('returns false when identifiers is empty array', () => {
      expect(isDeleteWithIdentifier({ identifiers: [] })).toBe(false);
    });

    it('returns false when identifiers array contains empty string', () => {
      expect(isDeleteWithIdentifier({ identifiers: ['n', ''] })).toBe(false);
    });

    it('returns false when identifiers is not string or array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isDeleteWithIdentifier({ identifiers: 123 })).toBe(false);
    });
  });

  describe('assertDeleteWithIdentifier', () => {
    it('throws when identifier is empty string', () => {
      expect(() => assertDeleteWithIdentifier({ identifiers: '' })).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws when identifiers is empty array', () => {
      expect(() => assertDeleteWithIdentifier({ identifiers: [] })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isDeleteWithLiteral', () => {
    it('returns false when literal key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isDeleteWithLiteral({})).toBe(false);
    });

    it('returns true for valid non-empty string', () => {
      expect(isDeleteWithLiteral({ literal: 'n' })).toBe(true);
    });

    it('returns false when literal is empty string', () => {
      expect(isDeleteWithLiteral({ literal: '' })).toBe(false);
    });

    it('returns false when literal is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isDeleteWithLiteral({ literal: 123 })).toBe(false);
    });
  });

  describe('assertDeleteWithLiteral', () => {
    it('throws when literal is empty string', () => {
      expect(() => assertDeleteWithLiteral({ literal: '' })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isRemoveProperties', () => {
    it('returns false when properties key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isRemoveProperties({ identifier: 'n' })).toBe(false);
    });

    it('returns false when identifier key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isRemoveProperties({ properties: ['name'] })).toBe(false);
    });

    it('returns true for valid configuration', () => {
      expect(
        isRemoveProperties({ identifier: 'n', properties: ['name'] }),
      ).toBe(true);
      expect(isRemoveProperties({ identifier: 'n', properties: 'name' })).toBe(
        true,
      );
    });

    it('returns false when identifier is empty', () => {
      expect(isRemoveProperties({ identifier: '', properties: ['name'] })).toBe(
        false,
      );
    });

    it('returns false when properties is empty array', () => {
      expect(isRemoveProperties({ identifier: 'n', properties: [] })).toBe(
        false,
      );
    });

    it('returns false when properties is not string or array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isRemoveProperties({ identifier: 'n', properties: 123 })).toBe(
        false,
      );
    });
  });

  describe('assertRemoveProperties', () => {
    it('throws when identifier is empty', () => {
      expect(() =>
        assertRemoveProperties({ identifier: '', properties: ['name'] }),
      ).toThrow(NeogmaConstraintError);
    });

    it('throws when properties is empty array', () => {
      expect(() =>
        assertRemoveProperties({ identifier: 'n', properties: [] }),
      ).toThrow(NeogmaConstraintError);
    });
  });

  describe('isRemoveLabels', () => {
    it('returns false when labels key is missing', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isRemoveLabels({ identifier: 'n' })).toBe(false);
    });

    it('returns true for valid configuration', () => {
      expect(isRemoveLabels({ identifier: 'n', labels: ['Label'] })).toBe(true);
      expect(isRemoveLabels({ identifier: 'n', labels: 'Label' })).toBe(true);
    });

    it('returns false when identifier is empty', () => {
      expect(isRemoveLabels({ identifier: '', labels: ['Label'] })).toBe(false);
    });

    it('returns false when labels is empty array', () => {
      expect(isRemoveLabels({ identifier: 'n', labels: [] })).toBe(false);
    });
  });

  describe('assertRemoveLabels', () => {
    it('throws when identifier is empty', () => {
      expect(() =>
        assertRemoveLabels({ identifier: '', labels: ['Label'] }),
      ).toThrow(NeogmaConstraintError);
    });

    it('throws when labels is empty array', () => {
      expect(() => assertRemoveLabels({ identifier: 'n', labels: [] })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isReturnObject', () => {
    it('returns false for non-array', () => {
      expect(isReturnObject('n')).toBe(false);
    });

    it('returns false for array of strings (that is string[] type)', () => {
      expect(isReturnObject(['n', 'm'])).toBe(false);
    });

    it('returns true for valid ReturnObjectI', () => {
      expect(isReturnObject([{ identifier: 'n' }])).toBe(true);
      expect(isReturnObject([{ identifier: 'n' }, { identifier: 'm' }])).toBe(
        true,
      );
    });

    it('returns false when element has invalid identifier', () => {
      expect(isReturnObject([{ identifier: '' }])).toBe(false);
    });
  });

  describe('assertReturnObject', () => {
    it('throws when element has invalid identifier', () => {
      expect(() => assertReturnObject([{ identifier: '' }])).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isReturnParameter', () => {
    it('returns false when return key is missing', () => {
      expect(isReturnParameter({})).toBe(false);
    });

    it('returns true for valid string return', () => {
      expect(isReturnParameter({ return: 'n' })).toBe(true);
      expect(isReturnParameter({ return: 'n.name, m.age' })).toBe(true);
    });

    it('returns true when return key is present (validation happens in getReturnString)', () => {
      // Type guards now only check for key presence, validation happens in getReturnString
      expect(isReturnParameter({ return: '' })).toBe(true);
      expect(isReturnParameter({ return: [] })).toBe(true);
      expect(isReturnParameter({ return: ['', { identifier: 'm' }] })).toBe(
        true,
      );
      expect(isReturnParameter({ return: ['n', { identifier: '' }] })).toBe(
        true,
      );
      expect(isReturnParameter({ return: ['n', ''] })).toBe(true);
      expect(isReturnParameter({ return: [{ identifier: '' }] })).toBe(true);
      expect(isReturnParameter({ return: [null] })).toBe(true);
      expect(isReturnParameter({ return: [123] })).toBe(true);
    });

    it('returns true for valid string array return', () => {
      expect(isReturnParameter({ return: ['n', 'm'] })).toBe(true);
      expect(isReturnParameter({ return: ['n.name'] })).toBe(true);
    });

    it('returns true for valid object array return', () => {
      expect(isReturnParameter({ return: [{ identifier: 'n' }] })).toBe(true);
      expect(
        isReturnParameter({
          return: [{ identifier: 'n', property: 'name' }],
        }),
      ).toBe(true);
    });

    it('returns true for mixed array (strings and objects)', () => {
      // Mixed arrays are now allowed - strings are raw, objects are escaped
      expect(isReturnParameter({ return: ['n', { identifier: 'm' }] })).toBe(
        true,
      );
      expect(isReturnParameter({ return: [{ identifier: 'n' }, 'm'] })).toBe(
        true,
      );
      expect(
        isReturnParameter({
          return: ['count(n) AS total', { identifier: 'm', property: 'name' }],
        }),
      ).toBe(true);
    });
  });

  describe('assertReturnValue', () => {
    it('throws for invalid return value with empty string in array', () => {
      expect(() => assertReturnValue(['', { identifier: 'm' }])).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws for empty string', () => {
      expect(() => assertReturnValue('')).toThrow(NeogmaConstraintError);
    });

    it('does not throw for valid string', () => {
      expect(() => assertReturnValue('n.name')).not.toThrow();
    });

    it('does not throw for valid array', () => {
      expect(() => assertReturnValue(['n', { identifier: 'm' }])).not.toThrow();
    });
  });

  describe('isNodeWithWhere', () => {
    it('returns false when where key is missing', () => {
      expect(isNodeWithWhere({ label: 'User' })).toBe(false);
    });

    it('returns false when where is undefined', () => {
      expect(isNodeWithWhere({ label: 'User', where: undefined })).toBe(false);
    });

    it('returns true for valid where object', () => {
      expect(isNodeWithWhere({ where: { id: '123' } })).toBe(true);
    });

    it('returns false when where is not a plain object', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isNodeWithWhere({ where: 'invalid' })).toBe(false);
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isNodeWithWhere({ where: ['array'] })).toBe(false);
    });
  });

  describe('assertNodeWithWhere', () => {
    it('throws when where is not a plain object', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertNodeWithWhere({ where: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isNodeWithLabel', () => {
    it('returns false when label key is missing', () => {
      expect(isNodeWithLabel({})).toBe(false);
    });

    it('returns true for valid non-empty label', () => {
      expect(isNodeWithLabel({ label: 'User' })).toBe(true);
    });

    it('returns false when label is empty string', () => {
      expect(isNodeWithLabel({ label: '' })).toBe(false);
    });

    it('returns false when label is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(isNodeWithLabel({ label: 123 })).toBe(false);
    });
  });

  describe('assertNodeWithLabel', () => {
    it('throws when label is empty string', () => {
      expect(() => assertNodeWithLabel({ label: '' })).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws when label is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => assertNodeWithLabel({ label: 123 })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isNodeWithModel', () => {
    it('returns false when model key is missing', () => {
      expect(isNodeWithModel({ label: 'User' })).toBe(false);
    });

    it('returns false when model is null', () => {
      expect(isNodeWithModel({ model: null })).toBe(false);
    });

    it('returns false when model is undefined', () => {
      expect(isNodeWithModel({ model: undefined })).toBe(false);
    });
  });

  describe('assertNodeWithModel', () => {
    it('throws when model is null', () => {
      expect(() => assertNodeWithModel({ model: null })).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws when model is undefined', () => {
      expect(() => assertNodeWithModel({ model: undefined })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isNodeWithProperties', () => {
    it('returns false when properties key is missing', () => {
      expect(isNodeWithProperties({ label: 'User' })).toBe(false);
    });

    it('returns false when properties is undefined', () => {
      expect(
        isNodeWithProperties({ label: 'User', properties: undefined }),
      ).toBe(false);
    });

    it('returns true for valid properties object', () => {
      expect(
        isNodeWithProperties({ label: 'User', properties: { name: 'test' } }),
      ).toBe(true);
    });

    it('returns false when properties is not a plain object', () => {
      expect(
        // @ts-expect-error - testing runtime behavior with invalid input
        isNodeWithProperties({ label: 'User', properties: 'invalid' }),
      ).toBe(false);
    });
  });

  describe('assertNodeWithProperties', () => {
    it('throws when properties is not a plain object', () => {
      expect(() =>
        // @ts-expect-error - testing runtime behavior with invalid input
        assertNodeWithProperties({ label: 'User', properties: 'invalid' }),
      ).toThrow(NeogmaConstraintError);
    });
  });

  describe('isRelationshipWithWhere', () => {
    it('returns false when where key is missing', () => {
      expect(isRelationshipWithWhere({ direction: 'out' })).toBe(false);
    });

    it('returns false when where is undefined', () => {
      expect(
        isRelationshipWithWhere({ direction: 'out', where: undefined }),
      ).toBe(false);
    });

    it('returns true for valid where object', () => {
      expect(
        isRelationshipWithWhere({ direction: 'out', where: { since: 2020 } }),
      ).toBe(true);
    });

    it('returns false when where is not a plain object', () => {
      expect(
        // @ts-expect-error - testing runtime behavior with invalid input
        isRelationshipWithWhere({ direction: 'out', where: 'invalid' }),
      ).toBe(false);
    });
  });

  describe('assertRelationshipWithWhere', () => {
    it('throws when where is not a plain object', () => {
      expect(() =>
        // @ts-expect-error - testing runtime behavior with invalid input
        assertRelationshipWithWhere({ direction: 'out', where: 'invalid' }),
      ).toThrow(NeogmaConstraintError);
    });
  });

  describe('isRelationshipWithProperties', () => {
    it('returns false when properties key is missing', () => {
      expect(isRelationshipWithProperties({ direction: 'out' })).toBe(false);
    });

    it('returns false when properties is undefined', () => {
      expect(
        isRelationshipWithProperties({
          direction: 'out',
          properties: undefined,
        }),
      ).toBe(false);
    });

    it('returns true for valid properties object', () => {
      expect(
        isRelationshipWithProperties({
          direction: 'out',
          name: 'KNOWS',
          properties: { since: 2020 },
        }),
      ).toBe(true);
    });

    it('returns false when properties is not a plain object', () => {
      expect(
        isRelationshipWithProperties({
          direction: 'out',
          name: 'KNOWS',
          // @ts-expect-error - testing runtime behavior with invalid input
          properties: 'invalid',
        }),
      ).toBe(false);
    });
  });

  describe('assertRelationshipWithProperties', () => {
    it('throws when properties is not a plain object', () => {
      expect(() =>
        assertRelationshipWithProperties({
          direction: 'out',
          name: 'KNOWS',
          // @ts-expect-error - testing runtime behavior with invalid input
          properties: 'invalid',
        }),
      ).toThrow(NeogmaConstraintError);
    });
  });

  describe('isSetParameter', () => {
    it('returns false when set key is missing', () => {
      expect(isSetParameter({})).toBe(false);
    });

    it('returns true for valid string set', () => {
      expect(isSetParameter({ set: 'n.name = $name' })).toBe(true);
    });

    it('returns true for valid object set', () => {
      expect(
        isSetParameter({
          set: { identifier: 'n', properties: { name: 'test' } },
        }),
      ).toBe(true);
    });

    it('returns true when set key is present (validation happens in getSetString)', () => {
      // Type guards now only check for key presence
      expect(isSetParameter({ set: '' })).toBe(true);
      expect(isSetParameter({ set: '   ' })).toBe(true);
      expect(
        isSetParameter({
          set: { identifier: '', properties: { name: 'test' } },
        }),
      ).toBe(true);
      expect(
        isSetParameter({ set: { identifier: 'n', properties: null } }),
      ).toBe(true);
      expect(isSetParameter({ set: 123 })).toBe(true);
    });
  });

  describe('assertSetValue', () => {
    it('throws when set is empty string', () => {
      expect(() => assertSetValue('')).toThrow(NeogmaConstraintError);
    });

    it('throws when set is whitespace-only string', () => {
      expect(() => assertSetValue('   ')).toThrow(NeogmaConstraintError);
    });

    it('throws when set object has empty identifier', () => {
      expect(() =>
        assertSetValue({ identifier: '', properties: { name: 'test' } }),
      ).toThrow(NeogmaConstraintError);
    });

    it('throws when set object has null properties', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation of invalid input
        assertSetValue({ identifier: 'n', properties: null }),
      ).toThrow(NeogmaConstraintError);
    });

    it('does not throw for valid string', () => {
      expect(() => assertSetValue('n.name = "test"')).not.toThrow();
    });

    it('does not throw for valid object', () => {
      expect(() =>
        assertSetValue({ identifier: 'n', properties: { name: 'test' } }),
      ).not.toThrow();
    });
  });

  describe('isOnCreateSetParameter', () => {
    it('returns false when onCreateSet key is missing', () => {
      expect(isOnCreateSetParameter({})).toBe(false);
    });

    it('returns true when onCreateSet key is present with string', () => {
      expect(
        isOnCreateSetParameter({ onCreateSet: 'n.created = timestamp()' }),
      ).toBe(true);
    });

    it('returns true when onCreateSet key is present with object', () => {
      expect(
        isOnCreateSetParameter({
          onCreateSet: { identifier: 'n', properties: { name: 'test' } },
        }),
      ).toBe(true);
    });

    it('returns true when onCreateSet key is present (validation happens in assertOnCreateSetValue)', () => {
      // Type guard only checks for key presence
      expect(isOnCreateSetParameter({ onCreateSet: '' })).toBe(true);
      expect(isOnCreateSetParameter({ onCreateSet: 123 })).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isOnCreateSetParameter(null)).toBe(false);
      expect(isOnCreateSetParameter(undefined)).toBe(false);
    });
  });

  describe('assertOnCreateSetValue', () => {
    it('throws when onCreateSet is empty string', () => {
      expect(() => assertOnCreateSetValue('')).toThrow(NeogmaConstraintError);
    });

    it('throws when onCreateSet object has empty identifier', () => {
      expect(() =>
        assertOnCreateSetValue({
          identifier: '',
          properties: { name: 'test' },
        }),
      ).toThrow(NeogmaConstraintError);
    });

    it('throws when onCreateSet object has null properties', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation of invalid input
        assertOnCreateSetValue({ identifier: 'n', properties: null }),
      ).toThrow(NeogmaConstraintError);
    });

    it('does not throw for valid string', () => {
      expect(() =>
        assertOnCreateSetValue('n.created = timestamp()'),
      ).not.toThrow();
    });

    it('does not throw for valid object', () => {
      expect(() =>
        assertOnCreateSetValue({
          identifier: 'n',
          properties: { name: 'test' },
        }),
      ).not.toThrow();
    });
  });

  describe('isOnMatchSetParameter', () => {
    it('returns false when onMatchSet key is missing', () => {
      expect(isOnMatchSetParameter({})).toBe(false);
    });

    it('returns true when onMatchSet key is present with string', () => {
      expect(
        isOnMatchSetParameter({ onMatchSet: 'n.updated = timestamp()' }),
      ).toBe(true);
    });

    it('returns true when onMatchSet key is present with object', () => {
      expect(
        isOnMatchSetParameter({
          onMatchSet: { identifier: 'n', properties: { name: 'test' } },
        }),
      ).toBe(true);
    });

    it('returns true when onMatchSet key is present (validation happens in assertOnMatchSetValue)', () => {
      // Type guard only checks for key presence
      expect(isOnMatchSetParameter({ onMatchSet: '' })).toBe(true);
      expect(isOnMatchSetParameter({ onMatchSet: 123 })).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isOnMatchSetParameter(null)).toBe(false);
      expect(isOnMatchSetParameter(undefined)).toBe(false);
    });
  });

  describe('assertOnMatchSetValue', () => {
    it('throws when onMatchSet is empty string', () => {
      expect(() => assertOnMatchSetValue('')).toThrow(NeogmaConstraintError);
    });

    it('throws when onMatchSet object has empty identifier', () => {
      expect(() =>
        assertOnMatchSetValue({ identifier: '', properties: { name: 'test' } }),
      ).toThrow(NeogmaConstraintError);
    });

    it('throws when onMatchSet object has null properties', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation of invalid input
        assertOnMatchSetValue({ identifier: 'n', properties: null }),
      ).toThrow(NeogmaConstraintError);
    });

    it('does not throw for valid string', () => {
      expect(() =>
        assertOnMatchSetValue('n.updated = timestamp()'),
      ).not.toThrow();
    });

    it('does not throw for valid object', () => {
      expect(() =>
        assertOnMatchSetValue({
          identifier: 'n',
          properties: { name: 'test' },
        }),
      ).not.toThrow();
    });
  });
});
