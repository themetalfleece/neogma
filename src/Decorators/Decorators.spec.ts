import { Neogma } from '../Neogma';
import * as dotenv from 'dotenv';
import { Model, Props } from './model';
import { Property } from './property';
import { QueryBuilder } from '../Queries';
import {
  ModelPropertyDecoratorOptions,
  ModelRelationshipDecoratorOptions,
  getModelMetadata,
  parseModelMetadata,
} from './shared';
import { Relationship } from './relationship';

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

  it('should define model relationships', () => {
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
    } as ModelRelationshipDecoratorOptions;

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

      @Relationship(ordersRelationOptions)
      orders: Order[];
    }

    const userMetadata = getModelMetadata(User);

    expect(userMetadata).toBeTruthy();

    expect(userMetadata.relationships).toHaveProperty('orders');

    expect(userMetadata.relationships.orders).toMatchObject({
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

    expect(neogma.models).toHaveProperty(User.name);

    expect(neogma.models[User.name]).toBeTruthy();
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

    type UserProps = Props<User>;

    const Users = neogma.addModel<UserProps>(User);

    const userData: User = {
      name: 'John',
      age: 30,
    };

    const user = await Users.createOne({
      name: 10,
      age: '',
    });

    expect(user).toBeTruthy();
    expect(user.name).toEqual(userData.name);
    expect(user.age).toEqual(userData.age);
  });

  it('should populate the db with a record when createOne is called on the created model and its relationship', async () => {
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
    } as ModelRelationshipDecoratorOptions;

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

      @Relationship(projectsRelationOptions)
      projects: Project[];
    }

    type AllWorkerProps = Props<Worker>;

    type WorkerProps = Omit<AllWorkerProps, 'projects'>;

    const Workers = neogma.addModel<WorkerProps>(Worker);

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

    expect(neogma.models[projectLabel]).toBeTruthy();

    const worker = await Workers.createOne(workerData);

    expect(worker).toBeTruthy();
    expect(worker.name).toEqual(workerData.name);
    expect(worker.age).toEqual(workerData.age);
  });
});
