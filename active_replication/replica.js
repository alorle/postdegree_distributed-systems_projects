const zmq = require('zeromq');

if (process.argv.length !== 4) {
  console.error('Usage: node replica.js <IDENTIFIER> <ROUTER_PORT>');
  process.exit();
}

/**
 * ESTADO DEL REPLICA
 */
const identity = process.argv[2];
const replica_router_host = 'localhost';
const replica_router_port = process.argv[3];
const replica_router_addr = `tcp://${replica_router_host}:${replica_router_port}`;

/**
 * Socket que conecta REPLICA con REPLICA_ROUTER
 */
const router_socket = zmq.socket('dealer');
router_socket.identity = identity;
router_socket.connect(replica_router_addr);
router_socket.on('message', (senderId, message) => onClientRequest(senderId, JSON.parse(message)));

/**
 * Al recibir una petición de CLIENTE se debe responder
 * @param {*} req
 */
function onClientRequest(senderId, req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${req.data}`);

  if (req.data === 'Hola') {
    router_socket.send(JSON.stringify({
      id: req.id,
      from: identity,
      to: req.from,
      type: 'replay',
      message: "Adios"
    }))
  }
}

process.on('SIGINT', function () {
  console.log("Closing ...");
  router_socket.close();
});
