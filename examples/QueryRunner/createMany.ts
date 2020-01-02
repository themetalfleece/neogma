import { connect } from '../../src/Driver';
import { createMany } from '../../src/QueryRunner/QueryRunner';
import { getSession } from '../../src/Sessions/Sessions';

// tslint:disable: no-console

const createManyExample = async () => {
    // connect to the database
    await connect();
    // create a session
    await getSession(null, async (session) => {
        // create the nodes
        await createMany(session, `Test Label`, [{
            booleanField: true,
            stringField: 'String',
            numberField: 38,
        }]);
        console.log(`success`);
        process.exit(0);
    });
};

createManyExample()
    .catch((err) => {
        console.error(err);
        process.exit(-1);
    });
