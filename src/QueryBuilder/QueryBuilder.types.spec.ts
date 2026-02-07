import { NeogmaConstraintError } from '../Errors/NeogmaConstraintError';
import {
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
  isRelationshipWithProperties,
  isRelationshipWithWhere,
  isRemoveLabels,
  isRemoveProperties,
  isReturnObject,
} from './QueryBuilder.types';

describe('QueryBuilder.types type guards', () => {
  describe('isMatchRelated', () => {
    it('returns false when related key is missing', () => {
      expect(isMatchRelated({})).toBe(false);
    });

    it('returns true for valid array', () => {
      expect(isMatchRelated({ related: [] })).toBe(true);
    });

    it('throws when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isMatchRelated({ related: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isMatchRelated({ related: 123 })).toThrow(
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

    it('throws when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isMatchMultiple({ multiple: 'invalid' })).toThrow(
        NeogmaConstraintError,
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isMatchMultiple({ multiple: {} })).toThrow(
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

    it('throws when literal is empty string', () => {
      expect(() => isMatchLiteral({ literal: '' })).toThrow(
        "Invalid 'literal' value",
      );
    });

    it('throws when literal is whitespace only', () => {
      expect(() => isMatchLiteral({ literal: '   ' })).toThrow(
        NeogmaConstraintError,
      );
    });

    it('throws when literal is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isMatchLiteral({ literal: 123 })).toThrow(
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

    it('throws when related exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isCreateRelated({ related: {} })).toThrow(
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

    it('throws when multiple exists but is not an array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isCreateMultiple({ multiple: 'invalid' })).toThrow(
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

    it('throws when identifier is empty string', () => {
      expect(() => isDeleteWithIdentifier({ identifiers: '' })).toThrow(
        "Invalid 'identifiers' value",
      );
    });

    it('throws when identifiers is empty array', () => {
      expect(() => isDeleteWithIdentifier({ identifiers: [] })).toThrow(
        "Invalid 'identifiers' value: expected a non-empty array",
      );
    });

    it('throws when identifiers array contains empty string', () => {
      expect(() => isDeleteWithIdentifier({ identifiers: ['n', ''] })).toThrow(
        'array element at index 1',
      );
    });

    it('throws when identifiers is not string or array', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isDeleteWithIdentifier({ identifiers: 123 })).toThrow(
        'expected a string or array',
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

    it('throws when literal is empty string', () => {
      expect(() => isDeleteWithLiteral({ literal: '' })).toThrow(
        "Invalid 'literal' value",
      );
    });

    it('throws when literal is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isDeleteWithLiteral({ literal: 123 })).toThrow(
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

    it('throws when identifier is empty', () => {
      expect(() =>
        isRemoveProperties({ identifier: '', properties: ['name'] }),
      ).toThrow("Invalid 'identifier' value");
    });

    it('throws when properties is empty array', () => {
      expect(() =>
        isRemoveProperties({ identifier: 'n', properties: [] }),
      ).toThrow("Invalid 'properties' value");
    });

    it('throws when properties is not string or array', () => {
      expect(() =>
        // @ts-expect-error - testing runtime behavior with invalid input
        isRemoveProperties({ identifier: 'n', properties: 123 }),
      ).toThrow('expected a string or array');
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

    it('throws when identifier is empty', () => {
      expect(() =>
        isRemoveLabels({ identifier: '', labels: ['Label'] }),
      ).toThrow("Invalid 'identifier' value");
    });

    it('throws when labels is empty array', () => {
      expect(() => isRemoveLabels({ identifier: 'n', labels: [] })).toThrow(
        "Invalid 'labels' value",
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

    it('throws when element is not an object', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isReturnObject([{ identifier: 'n' }, null])).toThrow(
        'expected an object, got null',
      );
    });

    it('throws when element has invalid identifier', () => {
      expect(() => isReturnObject([{ identifier: '' }])).toThrow(
        "'identifier' must be a non-empty string",
      );
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

    it('throws when where is not a plain object', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isNodeWithWhere({ where: 'invalid' })).toThrow(
        "Invalid 'where' value",
      );
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isNodeWithWhere({ where: ['array'] })).toThrow(
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

    it('throws when label is empty string', () => {
      expect(() => isNodeWithLabel({ label: '' })).toThrow(
        "Invalid 'label' value",
      );
    });

    it('throws when label is not a string', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(() => isNodeWithLabel({ label: 123 })).toThrow(
        NeogmaConstraintError,
      );
    });
  });

  describe('isNodeWithModel', () => {
    it('returns false when model key is missing', () => {
      expect(isNodeWithModel({ label: 'User' })).toBe(false);
    });

    it('throws when model is null', () => {
      expect(() => isNodeWithModel({ model: null })).toThrow(
        "Invalid 'model' value",
      );
    });

    it('throws when model is undefined', () => {
      expect(() => isNodeWithModel({ model: undefined })).toThrow(
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

    it('throws when properties is not a plain object', () => {
      expect(() =>
        // @ts-expect-error - testing runtime behavior with invalid input
        isNodeWithProperties({ label: 'User', properties: 'invalid' }),
      ).toThrow("Invalid 'properties' value");
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

    it('throws when where is not a plain object', () => {
      expect(() =>
        // @ts-expect-error - testing runtime behavior with invalid input
        isRelationshipWithWhere({ direction: 'out', where: 'invalid' }),
      ).toThrow("Invalid 'where' value");
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

    it('throws when properties is not a plain object', () => {
      expect(() =>
        isRelationshipWithProperties({
          direction: 'out',
          name: 'KNOWS',
          // @ts-expect-error - testing runtime behavior with invalid input
          properties: 'invalid',
        }),
      ).toThrow("Invalid 'properties' value");
    });
  });
});
