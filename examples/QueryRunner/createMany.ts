import { connect } from '../../src/Driver';
import { acquireSession } from '../../src/Sessions/Sessions';
import { createMany } from '../../src/QueryRunner/QueryRunner';

const createManyExample = async () => {
    // connect to the database
    await connect();
    // create a session
    await acquireSession(null, async (session) => {
        // create the nodes
        await createMany(session, `John`, [{
            booleanField: true,
            stringField: 'String',
            numberField: 38,
        }]);
        console.log(`success`);
        process.exit(0);
    });
}

createManyExample();
