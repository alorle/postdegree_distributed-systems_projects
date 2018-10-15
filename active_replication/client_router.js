const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node client_router.js <OUTER_PORT> <INNER_PORT>');
  process.exit();
}

const OUTER_PORT = process.argv[2];
const INNER_PORT = process.argv[3];

const outer_router = zmq.socket('router');
outer_router.identity = 'client_router_outer';
outer_router.bind(`tcp://*:${OUTER_PORT}`);

const inner_router = zmq.socket('router');
inner_router.identity = 'client_router_inner';
inner_router.bind(`tcp://*:${INNER_PORT}`);

outer_router.on('message', (senderId, message) => {
  const msg = JSON.parse(message);
  console.log(`Message '${msg.id}' recieved from '${msg.from}' for '${msg.to}' of type '${msg.type}': ${JSON.stringify(msg.data)}`);
  inner_router.send([msg.to, inner_router.identity, JSON.stringify(msg)]);
});

process.on('SIGINT', function () {
  outer_router.disconnect();
  inner_router.disconnect();
});
