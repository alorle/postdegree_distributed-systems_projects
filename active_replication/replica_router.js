const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node replica_router.js <HANDLER_SIDE_PORT> <REPLICA_SIDE_PORT>');
  process.exit();
}

/**
 * ESTADO DEL REPLICA_ROUTER
 */
const handler_id = 'replica_router_handler';
const handler_host = '*';
const handler_port = process.argv[2];
const handler_addr = `tcp://${handler_host}:${handler_port}`;

const replica_id = 'replica_router_replica';
const replica_host = '*';
const replica_port = process.argv[3];
const replica_addr = `tcp://${replica_host}:${replica_port}`;

/**
 * Socket expuesto hacia HANDLER
 */
const handler_socket = zmq.socket('router');
handler_socket.identity = handler_id;
handler_socket.bind(handler_addr);
handler_socket.on('message', (senderId, message) => onHandlerRequest(senderId, JSON.parse(message)));

/**
 * Socket expuesto hacia REPLICA
 */
const replica_socket = zmq.socket('router');
replica_socket.identity = replica_id;
replica_socket.bind(replica_addr);
replica_socket.on('message', (senderId, message) => onReplicaReplay(senderId, JSON.parse(message)));

function onHandlerRequest(senderId, req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' for '${req.to}' of type '${req.type}': ${req.data}`);
  replica_socket.send(['replica1', req.from, JSON.stringify(req)]);
};

function onReplicaReplay(senderId, rep) {
  console.log(`Message '${rep.id}' recieved from '${rep.from}' for '${rep.to}' of type '${rep.type}': ${rep.data}`);
  handler_socket.send(['handler1', rep.from, JSON.stringify(rep)]);
};

process.on('SIGINT', function () {
  console.log("Closing ...");
  handler_socket.close();
  replica_socket.close();
});
