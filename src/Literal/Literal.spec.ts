import { Literal } from './Literal';

describe('Literal', () => {
  describe('constructor and getValue', () => {
    it('should store and return a string value', () => {
      const value = 'test value';
      const literal = new Literal(value);

      expect(literal.getValue()).toBe(value);
    });

    it('should handle empty string', () => {
      const literal = new Literal('');

      expect(literal.getValue()).toBe('');
    });

    it('should handle special characters', () => {
      const value = 'name.property[0]';
      const literal = new Literal(value);

      expect(literal.getValue()).toBe(value);
    });

    it('should handle Cypher keywords', () => {
      const value = 'MATCH';
      const literal = new Literal(value);

      expect(literal.getValue()).toBe(value);
    });

    it('should handle property access syntax', () => {
      const value = 'n.name';
      const literal = new Literal(value);

      expect(literal.getValue()).toBe(value);
    });
  });

  describe('instance independence', () => {
    it('should create independent instances', () => {
      const literal1 = new Literal('value1');
      const literal2 = new Literal('value2');

      expect(literal1.getValue()).toBe('value1');
      expect(literal2.getValue()).toBe('value2');
      expect(literal1.getValue()).not.toBe(literal2.getValue());
    });

    it('should be instanceof Literal', () => {
      const literal = new Literal('test');

      expect(literal).toBeInstanceOf(Literal);
    });
  });

  describe('common use cases', () => {
    it('should handle label names', () => {
      const label = new Literal('User');

      expect(label.getValue()).toBe('User');
    });

    it('should handle relationship types', () => {
      const relType = new Literal('KNOWS');

      expect(relType.getValue()).toBe('KNOWS');
    });

    it('should handle property names', () => {
      const propName = new Literal('createdAt');

      expect(propName.getValue()).toBe('createdAt');
    });

    it('should handle Cypher function calls', () => {
      const funcCall = new Literal('COUNT(*)');

      expect(funcCall.getValue()).toBe('COUNT(*)');
    });

    it('should handle complex Cypher expressions', () => {
      const expression = new Literal('n.age + 10');

      expect(expression.getValue()).toBe('n.age + 10');
    });
  });
});
