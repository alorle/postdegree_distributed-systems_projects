const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node replica_router.js <HANDLERS_PORT> <REPLICAS_PORT>');
  process.exit();
}

/**
 * ROUTER state
 */
const handlers_id = 'replica_router_handler';
const handlers_host = '*';
const handlers_port = process.argv[2];
const handlers_addr = `tcp://${handlers_host}:${handlers_port}`;

const replicas_id = 'replica_router_replica';
const replicas_host = '*';
const replicas_port = process.argv[3];
const replicas_addr = `tcp://${replicas_host}:${replicas_port}`;

const LOG_TAG = 'ROUTER';

console.log(`${LOG_TAG} - ${handlers_addr} <> ${replicas_addr}`);

/**
 * Handlers side router
 */
const handlers = zmq.socket('router');
handlers.identity = handlers_id;
handlers.bind(handlers_addr);
handlers.on('message', (senderId, message) => onHandlerRequest(JSON.parse(message)));

/**
 * Replicas side router
 */
const replicas = zmq.socket('router');
replicas.identity = replicas_id;
replicas.bind(replicas_addr);
replicas.on('message', (senderId, message) => onReplicaReplay(JSON.parse(message)));

function onHandlerRequest(req) {
  console.log(`${LOG_TAG} - Request '${req.id}' recieved from '${req.from}' for '${req.to}' of type '${req.type}'`);
  replicas.send([req.to, req.from, JSON.stringify(req)]);
}

function onReplicaReplay(rep) {
  console.log(`${LOG_TAG} - Replay '${rep.id}' recieved from '${rep.from}' for '${rep.to}' of type '${rep.type}': ${rep.data}`);
  handlers.send([rep.to, rep.from, JSON.stringify(rep)]);
}

process.on('SIGINT', function () {
  console.log(`${LOG_TAG} - Closing ...`);
  handlers.close();
  replicas.close();
});
