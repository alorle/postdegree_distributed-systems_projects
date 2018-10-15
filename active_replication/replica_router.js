const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node replica_router.js <OUTER_PORT> <INNER_PORT>');
  process.exit();
}

const OUTER_PORT = process.argv[2];
const INNER_PORT = process.argv[3];

const outer_router = zmq.socket('router');
outer_router.identity = 'replica_router_outer';
outer_router.bind(`tcp://*:${OUTER_PORT}`);
outer_router.on('message', (senderId, message) => onHandlerRequest(JSON.parse(message)));

const inner_router = zmq.socket('router');
inner_router.identity = 'replica_router_inner';
inner_router.bind(`tcp://*:${INNER_PORT}`);
inner_router.on('message', (senderId, message) => onReplicaReplay(JSON.parse(message)));

function onHandlerRequest(req) {
  console.log(req);
  inner_router.send(['replica1', req.from, JSON.stringify(req)]);
};

function onReplicaReplay(req) {
  console.log(req);
  inner_router.send(['replica1', req.from, JSON.stringify(req)]);
};

process.on('SIGINT', function () {
  outer_router.disconnect();
  inner_router.disconnect();
});
