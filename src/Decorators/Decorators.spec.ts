import { Neogma } from '../Neogma';
import * as dotenv from 'dotenv';
import { Model } from './model';
import { Property } from './property';
import { QueryBuilder } from '../Queries';
import {
  ModelPropertyDecoratorOptions,
  ModelRelationDecoratorOptions,
  getModelMetadata,
  parseModelMetadata,
} from './shared';
import { Relation } from './relation';
import { NeogmaModel } from '../ModelOps';

let neogma: Neogma;

beforeAll(async () => {
  dotenv.config();
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });

  await neogma.verifyConnectivity();
  QueryBuilder.queryRunner = neogma.queryRunner;
});

afterAll(async () => {
  await neogma.driver.close();
});

describe('Decorators', () => {
  it('should define model name', () => {
    @Model()
    class User {}

    const metadata = getModelMetadata(User);

    expect(metadata).toBeTruthy();

    expect(metadata.name).toEqual(User.name);
  });

  it('should define model name, but allow label overrides', () => {
    const labelOverride = 'Admin';
    @Model({ label: labelOverride })
    class User {}

    const metadata = getModelMetadata(User);

    expect(metadata).toBeTruthy();

    expect(metadata.name).toEqual(labelOverride);
  });

  it('should define model properties', () => {
    @Model()
    class User {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;
    }

    const metadata = getModelMetadata(User);

    expect(metadata).toBeTruthy();

    expect(metadata.properties).toHaveProperty('name');

    expect(metadata.properties).toHaveProperty('age');
  });

  it('should define model properties and schema', () => {
    const userNameOptions = {
      schema: {
        type: 'string',
        required: true,
      },
    } as ModelPropertyDecoratorOptions;

    const userAgeOptions = {
      schema: {
        type: 'number',
        required: true,
      },
    } as ModelPropertyDecoratorOptions;

    @Model()
    class User {
      @Property(userNameOptions)
      name: string;

      @Property(userAgeOptions)
      age: number;
    }

    const metadata = getModelMetadata(User);

    expect(metadata).toBeTruthy();

    expect(metadata.properties.name).toMatchObject(userNameOptions);

    expect(metadata.properties.age).toMatchObject(userAgeOptions);
  });

  it('should define model relations', () => {
    @Model()
    class Order {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      orderNumber: number;
    }

    const ordersRelationOptions = {
      model: Order,
      name: 'HAS_ORDER',
      direction: 'out',
    } as ModelRelationDecoratorOptions;

    @Model()
    class User {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;

      @Relation(ordersRelationOptions)
      orders: Order[];
    }

    const userMetadata = getModelMetadata(User);

    expect(userMetadata).toBeTruthy();

    expect(userMetadata.relations).toHaveProperty('orders');

    expect(userMetadata.relations.orders).toMatchObject({
      ...ordersRelationOptions,
      model: Order.prototype,
    });

    const orderMetadata = getModelMetadata(Order);

    expect(orderMetadata).toBeTruthy();

    expect(orderMetadata.properties).toHaveProperty('name');

    expect(orderMetadata.properties).toHaveProperty('orderNumber');
  });

  it('should parse model metadata to model factory creation params', () => {
    @Model()
    class User {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;
    }

    const userMetadata = getModelMetadata(User);

    const parsedMetadata = parseModelMetadata(userMetadata);

    expect(parsedMetadata).toBeTruthy();

    expect(parsedMetadata.label).toBe(User.name);

    for (const property in userMetadata.properties) {
      expect(parsedMetadata.schema[property]).toMatchObject(
        userMetadata.properties[property].schema,
      );
    }
  });

  it('should create a model from class definition', () => {
    @Model()
    class User {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;
    }

    neogma.addModel(User);

    expect(neogma).toHaveProperty(User.name);

    expect(neogma[User.name]).toBeTruthy();

    expect(neogma.modelsByName).toHaveProperty(User.name);

    expect(neogma.modelsByName[User.name]).toBeTruthy();
  });

  it('should populate the db with a record when createOne is called on the created model', async () => {
    @Model()
    class User {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;
    }

    const Users: NeogmaModel<{ name: string; age: number }, any, any, any> =
      neogma.addModel(User) as unknown as NeogmaModel<
        { name: string; age: number },
        any,
        any,
        any
      >;

    const userData: User = {
      name: 'John',
      age: 30,
    };

    const user = await Users.createOne(userData);

    expect(user).toBeTruthy();
    expect(user.name).toEqual(userData.name);
    expect(user.age).toEqual(userData.age);
  });

  it('should populate the db with a record when createOne is called on the created model and its relation', async () => {
    const projectLabel = 'TeamProject';
    @Model({ label: projectLabel })
    class Project {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      teamSize: number;
    }

    const projectsRelationOptions = {
      model: Project,
      name: 'HAS_PROJECT',
      direction: 'out',
    } as ModelRelationDecoratorOptions;

    @Model()
    class Worker {
      @Property({
        schema: {
          type: 'string',
        },
      })
      name: string;

      @Property({
        schema: {
          type: 'number',
        },
      })
      age: number;

      @Relation(projectsRelationOptions)
      projects: Project[];
    }

    const Workers = neogma.addModel(Worker);

    const workerData = {
      name: 'John',
      age: 30,
      projects: {
        properties: [
          {
            name: '3',
            teamSize: 5,
          },
        ],
      },
    };

    expect(neogma[projectLabel]).toBeTruthy();

    const worker = await Workers.createOne(workerData);

    expect(worker).toBeTruthy();
    expect(worker.name).toEqual(workerData.name);
    expect(worker.age).toEqual(workerData.age);
  });
});
