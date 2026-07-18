const { ModelFactory, Type } = require('neogma');

/**
 * Build every example model using ModelFactory.
 *
 * Order matters for relationships: define leaf models first, then models
 * that reference them.
 *
 * @param {import('neogma').Neogma} neogma
 */
function buildModels(neogma) {
  const OrderItems = ModelFactory(
    {
      label: 'ExampleOrderItem',
      schema: {
        id: Type.String(),
        sku: Type.String({ minLength: 1 }),
        price: Type.Number({ minimum: 0 }),
      },
      primaryKeyField: 'id',
    },
    neogma,
  );

  const Tags = ModelFactory(
    {
      label: ['ExampleTag', 'Searchable'],
      schema: {
        id: Type.String(),
        name: Type.String({ minLength: 1 }),
      },
      primaryKeyField: 'id',
    },
    neogma,
  );

  const Orders = ModelFactory(
    {
      label: 'ExampleOrder',
      schema: {
        id: Type.String(),
        name: Type.String({ minLength: 1 }),
        status: Type.Optional(Type.String()),
        total: Type.Optional(Type.Number({ minimum: 0 })),
      },
      primaryKeyField: 'id',
      relationships: {
        Items: {
          model: OrderItems,
          direction: 'out',
          name: 'CONTAINS',
          properties: {
            Quantity: {
              property: 'quantity',
              schema: Type.Number({ minimum: 1 }),
            },
          },
        },
      },
    },
    neogma,
  );

  const Users = ModelFactory(
    {
      label: 'ExampleUser',
      schema: {
        id: Type.String(),
        name: Type.String({ minLength: 2 }),
        email: Type.String({ minLength: 3, pattern: '^[^@]+@[^@]+$' }),
        age: Type.Optional(Type.Number({ minimum: 0, maximum: 130 })),
      },
      primaryKeyField: 'id',
      relationships: {
        Orders: {
          model: Orders,
          direction: 'out',
          name: 'CREATES',
          properties: {
            Rating: {
              property: 'rating',
              schema: Type.Number({ minimum: 1, maximum: 5 }),
            },
          },
        },
        Tagged: {
          model: Tags,
          direction: 'out',
          name: 'TAGGED_AS',
        },
      },
    },
    neogma,
  );

  return { Users, Orders, OrderItems, Tags };
}

module.exports = { buildModels };
