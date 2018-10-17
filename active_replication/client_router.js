const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node client_router.js <CLIENT_SIDE_PORT> <HANDLER_SIDE_PORT>');
  process.exit();
}

/**
 * ESTADO DEL HANDLER_ROUTER
 */
const rr_id = 'handler_router_rr';
const rr_host = '*';
const rr_port = process.argv[2];
const rr_addr = `tcp://${rr_host}:${rr_port}`;

const handler_id = 'handler_router_handler';
const handler_host = '*';
const handler_port = process.argv[3];
const handler_addr = `tcp://${handler_host}:${handler_port}`;

/**
 * Socket expuesto hacia RETRANSMISIÓN-REDIRECCIÓN
 */
const rr_socket = zmq.socket('router');
rr_socket.identity = rr_id;
rr_socket.bind(rr_addr);
rr_socket.on('message', (senderId, message) => onClientRequest(senderId, JSON.parse(message)));

/**
 * Socket expuesto hacia HANDLER
 */
const handler_socket = zmq.socket('router');
handler_socket.identity = handler_id;
handler_socket.bind(handler_addr);
handler_socket.on('message', (senderId, message) => onHandlerReplay(senderId, JSON.parse(message)));

/**
 * Al recibir una petición de RETRANSMISIÓN-REDIRECCIÓN se debe:
 *  1. Retransmitir la petición al HANDLER solicitado
 *
 * @param string sender id
 * @param JSON request
 */
function onClientRequest(senderId, req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' for '${req.to}' of type '${req.type}': ${req.data}`);
  handler_socket.send([req.to, handler_socket.identity, JSON.stringify(req)]);
};

/**
 * Al recibir una respuesta de HANDLER se debe:
 *  1. Retransmitir la respuesta al RETRANSMISIÓN-REDIRECCIÓN correspondiente
 *
 * @param string sender id
 * @param JSON request
 */
function onHandlerReplay(senderId, req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' for '${req.to}' of type '${req.type}': ${req.data}`);
  rr_socket.send([req.to, rr_socket.identity, JSON.stringify(req)]);
};

process.on('SIGINT', function () {
  console.log("Closing ...");
  rr_socket.close();
  handler_socket.close();
});
