const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node router_router.js <OUTER_PORT> <INNER_PORT>');
  process.exit();
}

const OUTER_PORT = process.argv[2];
const INNER_PORT = process.argv[3];

const outer_router = zmq.socket('router');
outer_router.bindSync(`tcp://*:${OUTER_PORT}`);
outer_router.identity = 'outer_router';

const inner_router = zmq.socket('router');
inner_router.bindSync(`tcp://*:${INNER_PORT}`);
inner_router.identity = 'inner_router';

outer_router.on('message', (senderId, message) => {
  const msg = JSON.parse(message);
  console.log(`Message '${msg.data}' recieved from '${msg.from}' for '${msg.to}'`);
  inner_router.send([msg.to, inner_router.identity, JSON.stringify(msg)]);
});
