import { randomUUID as uuid } from 'crypto';

import { neo4jDriver } from '../index';
import { QueryRunner } from '../Queries/QueryRunner';
import { ModelFactory } from '.';
import { closeNeogma, getNeogma } from './testHelpers';

const { getResultProperties } = QueryRunner;

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('Neo4jSupportedTypes', () => {
  const expectNeo4jTypes = {
    point: (
      withNumber: neo4jDriver.Point<number>,
      withInteger: neo4jDriver.Point<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.srid).toEqual(withInteger.srid.low);
      expect(withNumber.x).toEqual(withInteger.x);
      expect(withNumber.y).toEqual(withInteger.y);
      expect(withNumber.z).toEqual(withInteger.z);
    },
    date: (
      withNumber: neo4jDriver.Date<number>,
      withInteger: neo4jDriver.Date<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
    },
    localTime: (
      withNumber: neo4jDriver.LocalTime<number>,
      withInteger: neo4jDriver.LocalTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
    },
    dateTime: (
      withNumber: neo4jDriver.DateTime<number>,
      withInteger: neo4jDriver.DateTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
      expect(withNumber.timeZoneOffsetSeconds).toEqual(
        withInteger.timeZoneOffsetSeconds?.low,
      );
      expect(withNumber.timeZoneId).toEqual(withInteger.timeZoneId);
    },
    localDateTime: (
      withNumber: neo4jDriver.LocalDateTime<number>,
      withInteger: neo4jDriver.LocalDateTime<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.year).toEqual(withInteger.year.low);
      expect(withNumber.month).toEqual(withInteger.month.low);
      expect(withNumber.day).toEqual(withInteger.day.low);
      expect(withNumber.hour).toEqual(withInteger.hour.low);
      expect(withNumber.minute).toEqual(withInteger.minute.low);
      expect(withNumber.second).toEqual(withInteger.second.low);
      expect(withNumber.nanosecond).toEqual(withInteger.nanosecond.low);
    },
    duration: (
      withNumber: neo4jDriver.Duration<any>,
      withInteger: neo4jDriver.Duration<neo4jDriver.Integer>,
    ) => {
      expect(withNumber.months).toEqual(withInteger.months.low);
      expect(withNumber.days).toEqual(withInteger.days.low);
      expect(withNumber.seconds.low).toEqual(withInteger.seconds.low);
      expect(withNumber.nanoseconds.low).toEqual(withInteger.nanoseconds.low);
    },
  };

  it('creates a node with every supported neo4j type', async () => {
    const neogma = getNeogma();

    type UserAttributesI = {
      id: string;
      number: number;
      integer: neo4jDriver.Integer;
      string: string;
      boolean: boolean;
      point: neo4jDriver.Point<any>;
      date: neo4jDriver.Date<any>;
      time: neo4jDriver.Time<any>;
      localTime: neo4jDriver.LocalTime<any>;
      dateTime: neo4jDriver.DateTime<any>;
      localDateTime: neo4jDriver.LocalDateTime<any>;
      duration: neo4jDriver.Duration<any>;
      numberArr: number[];
      integerArr: neo4jDriver.Integer[];
      stringArr: string[];
      booleanArr: boolean[];
      pointArr: Array<neo4jDriver.Point<any>>;
      dateArr: Array<neo4jDriver.Date<any>>;
      timeArr: Array<neo4jDriver.Time<any>>;
      localTimeArr: Array<neo4jDriver.LocalTime<any>>;
      dateTimeArr: Array<neo4jDriver.DateTime<any>>;
      localDateTimeArr: Array<neo4jDriver.LocalDateTime<any>>;
      durationArr: Array<neo4jDriver.Duration<any>>;
    };
    type UsersRelatedNodesI = object;
    type UsersMethodsI = object;
    type UsersStaticsI = object;

    const Users = ModelFactory<
      UserAttributesI,
      UsersRelatedNodesI,
      UsersStaticsI,
      UsersMethodsI
    >(
      {
        label: 'User',
        schema: {
          id: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          number: {
            type: 'number',
            required: true,
          },
          integer: {
            type: 'any',
            conform: (v) => neo4jDriver.isInt(v),
            required: true,
          },
          string: {
            type: 'string',
            minLength: 1,
            required: true,
          },
          boolean: {
            type: 'boolean',
            required: true,
          },
          point: {
            type: 'any',
            conform: (v) => neo4jDriver.isPoint(v),
            required: true,
          },
          date: {
            type: 'any',
            conform: (v) => neo4jDriver.isDate(v),
            required: true,
          },
          localTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isLocalTime(v),
            required: true,
          },
          dateTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isDateTime(v),
            required: true,
          },
          localDateTime: {
            type: 'any',
            conform: (v) => neo4jDriver.isLocalDateTime(v),
            required: true,
          },
          time: {
            type: 'any',
            conform: (v) => neo4jDriver.isTime(v),
            required: true,
          },
          duration: {
            type: 'any',
            conform: (v) => neo4jDriver.isDuration(v),
            required: true,
          },
          numberArr: {
            type: 'array',
            required: true,
            items: {
              type: 'number',
              required: true,
            },
          },
          integerArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isInt(v),
              required: true,
            },
          },
          stringArr: {
            type: 'array',
            required: true,
            items: {
              type: 'string',
              minLength: 1,
              required: true,
            },
          },
          booleanArr: {
            type: 'array',
            required: true,
            items: {
              type: 'boolean',
              required: true,
            },
          },
          pointArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isPoint(v),
              required: true,
            },
          },
          dateArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDate(v),
              required: true,
            },
          },
          timeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isTime(v),
              required: true,
            },
          },
          localTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isLocalTime(v),
              required: true,
            },
          },
          dateTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDateTime(v),
              required: true,
            },
          },
          localDateTimeArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isLocalDateTime(v),
              required: true,
            },
          },
          durationArr: {
            type: 'array',
            required: true,
            items: {
              type: 'any',
              conform: (v) => neo4jDriver.isDuration(v),
              required: true,
            },
          },
        },
        relationships: [],
        statics: {},
        methods: {},
      },
      neogma,
    );

    const userData: UserAttributesI = {
      id: uuid(),
      number: 25,
      integer: new neo4jDriver.types.Integer(10, 10),
      string: 'John',
      boolean: true,
      point: new neo4jDriver.types.Point(4326, 1, 1),
      date: neo4jDriver.types.Date.fromStandardDate(new Date()),
      time: new neo4jDriver.types.Time(6, 4, 3, 2, 1),
      localTime: neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
      dateTime: neo4jDriver.types.DateTime.fromStandardDate(new Date()),
      localDateTime: neo4jDriver.types.LocalDateTime.fromStandardDate(
        new Date(),
      ),
      duration: new neo4jDriver.types.Duration(5, 4, 3, 2),
      numberArr: [35, 42],
      integerArr: [
        new neo4jDriver.types.Integer(11, 11),
        new neo4jDriver.types.Integer(12, 12),
      ],
      stringArr: ['Bob', 'Jack'],
      booleanArr: [true, false],
      pointArr: [
        new neo4jDriver.types.Point(4326, 1.1, 1.1),
        new neo4jDriver.types.Point(4326, 1.2, 1.2),
      ],
      dateArr: [
        neo4jDriver.types.Date.fromStandardDate(new Date()),
        neo4jDriver.types.Date.fromStandardDate(new Date()),
      ],
      timeArr: [
        new neo4jDriver.types.Time(6, 4, 3, 2, 1),
        new neo4jDriver.types.Time(7, 6, 5, 4, 3),
      ],
      localTimeArr: [
        neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
        neo4jDriver.types.LocalTime.fromStandardDate(new Date()),
      ],
      dateTimeArr: [
        neo4jDriver.types.DateTime.fromStandardDate(new Date()),
        neo4jDriver.types.DateTime.fromStandardDate(new Date()),
      ],
      localDateTimeArr: [
        neo4jDriver.types.LocalDateTime.fromStandardDate(new Date()),
        neo4jDriver.types.LocalDateTime.fromStandardDate(new Date()),
      ],
      durationArr: [
        new neo4jDriver.types.Duration(1, 2, 3, 4),
        new neo4jDriver.types.Duration(2, 3, 4, 5),
      ],
    };

    await Users.createOne(userData);

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userData.id },
    );

    const userInDbData = getResultProperties<typeof userData>(
      userInDbResult,
      'n',
    )[0];

    expect(userData).toBeTruthy();

    expect(userData.id).toEqual(userInDbData.id);

    expect(userData.number).toEqual(userInDbData.number);

    expect(userData.integer).toEqual(userInDbData.integer);

    expect(userData.string).toEqual(userInDbData.string);

    expect(userData.boolean).toEqual(userInDbData.boolean);

    expectNeo4jTypes.point(userData.point, userInDbData.point);
    userData.pointArr.forEach((point, index) =>
      expectNeo4jTypes.point(point, userInDbData.pointArr[index]),
    );

    expectNeo4jTypes.date(userData.date, userInDbData.date);
    userData.dateArr.forEach((date, index) =>
      expectNeo4jTypes.date(date, userInDbData.dateArr[index]),
    );

    expectNeo4jTypes.localTime(userData.localTime, userInDbData.localTime);
    userData.localTimeArr.forEach((localTime, index) =>
      expectNeo4jTypes.localTime(localTime, userInDbData.localTimeArr[index]),
    );

    expectNeo4jTypes.dateTime(userData.dateTime, userInDbData.dateTime);
    userData.dateTimeArr.forEach((dateTime, index) =>
      expectNeo4jTypes.dateTime(dateTime, userInDbData.dateTimeArr[index]),
    );

    expectNeo4jTypes.localDateTime(
      userData.localDateTime,
      userInDbData.localDateTime,
    );
    userData.localDateTimeArr.forEach((localDateTime, index) =>
      expectNeo4jTypes.localDateTime(
        localDateTime,
        userInDbData.localDateTimeArr[index],
      ),
    );
  });
});
