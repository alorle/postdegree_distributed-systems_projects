const zmq = require('zeromq');

if (process.argv.length !== 5) {
  console.error('Usage: node handler.js <IDENTIFIER> <CLIENT_ROUTER_PORT> <REPLICA_ROUTER_PORT>');
  process.exit();
}

/**
 * ESTADO DEL HANDLER
 */
const identity = process.argv[2];

const handler_router_host = 'localhost';
const handler_router_port = process.argv[3];
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

const replica_router_host = 'localhost';
const replica_router_port = process.argv[4];
const replica_router_addr = `tcp://${replica_router_host}:${replica_router_port}`;

const handler_router_socket = zmq.socket('dealer');
handler_router_socket.identity = identity;
handler_router_socket.connect(handler_router_addr);
handler_router_socket.on('message', (senderId, message) => onClientRequest(senderId, JSON.parse(message)));

const replica_router_socket = zmq.socket('dealer');
replica_router_socket.identity = identity;
replica_router_socket.connect(replica_router_addr);
replica_router_socket.on('message', (senderId, message) => onReplicaReplay(senderId, JSON.parse(message)));

const requests_map = {};

const replicas = [
  'replica1'
];

/**
 * Al recibir una petición de CLIENTE se debe:
 *  1. Obtener el número de secuencia de orden total de la petición
 *    - Si no existe, solicitar el número de secuencia y esperar a que se devuelva
 *  2. Para todas las peticiones desde la última servida hasta la recién recibida:
 *    - Enviar petición a todas las replicas
 *
 * @param string sender id
 * @param JSON request
 */
function onClientRequest(senderId, req) {
  if (req.to === identity) {
    console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${req.data}. Sending to all replicas...`);
    // TODO: solicitar orden total
    requests_map[req.id] = { ...req };

    req.from = identity;
    replicas.forEach((replica) => {
      req.to = replica;
      replica_router_socket.send(JSON.stringify(req));
    })
  } else {
    console.error(`Message recieved for '${req.to}' but this is '${identity}'`)
  }
}

/**
 * Al recibir una respuesta de REPLICA, retransmitir la respuesta a solicitante
 *
 * @param string sender id
 * @param JSON replay
 */
function onReplicaReplay(senderId, rep) {
  console.log(`Message '${rep.id}' recieved from '${rep.from}' of type '${rep.type}': ${rep.data}`);
  if (requests_map[rep.id] != undefined && requests_map[rep.id] !== null) {
    rep.to = requests_map[rep.id].from;
    rep.from = identity;
    handler_router_socket.send(JSON.stringify(rep));
  }
}

process.on('SIGINT', function () {
  handler_router_socket.close();
  replica_router_socket.close();
});
