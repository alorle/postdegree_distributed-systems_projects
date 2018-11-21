const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node client_router.js <CLIENTS_PORT> <HANDLERS_PORT>');
  process.exit();
}

/**
 * ROUTER state
 */
const clients_id = 'clients';
const clients_host = '*';
const clients_port = process.argv[2];
const clients_addr = `tcp://${clients_host}:${clients_port}`;

const handlers_id = 'handlers';
const handlers_host = '*';
const handlers_port = process.argv[3];
const handlers_addr = `tcp://${handlers_host}:${handlers_port}`;

const LOG_TAG = 'ROUTER';

/**
 * Clients side router
 */
const clients = zmq.socket('router');
clients.identity = clients_id;
clients.bind(clients_addr);
clients.on('message', (senderId, message) => onRequest(JSON.parse(message)));

/**
 * Handlers side router
 */
const handlers = zmq.socket('router');
handlers.identity = handlers_id;
handlers.bind(handlers_addr);
handlers.on('message', (senderId, message) => onReplay(JSON.parse(message)));

function onRequest(req) {
  console.log(`${LOG_TAG} - Request '${req.id}' recieved from '${req.from}' for '${req.to}' of type '${req.type}'`);
  handlers.send([req.to, req.from, JSON.stringify(req)]);
  // handlers.send([req.to, handlers.identity, JSON.stringify(req)]);
}

function onReplay(rep) {
  console.log(`${LOG_TAG} - Replay '${rep.id}' recieved from '${rep.from}' for '${rep.to}' of type '${rep.type}'`);
  clients.send([rep.to, rep.from, JSON.stringify(rep)]);
  // clients.send([rep.to, clients.identity, JSON.stringify(rep)]);
}

process.on('SIGINT', function () {
  console.log(`${LOG_TAG} - Closing ...`);
  clients.close();
  handlers.close();
});
