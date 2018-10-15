const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node client_rr.js <CLIENT_RR_PORT> <CLIENT_ROUTER_PORT>');
  process.exit();
}

// VARIABLES PRINCIPALES
let client_id = 'client1';
let request_counter = 0;
let current_request_id = null;
let handler_id = null;
let timeoutTimer = null;

const CLIENT_RR_PORT = process.argv[2];
const CLIENT_ROUTER_PORT = process.argv[3];

const rr_socket = zmq.socket('rep');
rr_socket.bind(`tcp://*:${CLIENT_RR_PORT}`);

const router_socket = zmq.socket('dealer');
router_socket.identity = client_id;
router_socket.connect(`tcp://localhost:${CLIENT_ROUTER_PORT}`);

rr_socket.on('message', (message) => onClientMessage(JSON.parse(message)));
router_socket.on('message', (senderId, message) => onHandlerMessage(JSON.parse(message)));

function buildRequestId(client, count) {
  return `${client}::${count}`
}

function randSelectHandlerId() {
  return 'handler1';
}

/**
 * Al recibir un mensaje del cliente debemos:
 *  1. Decidir el manejador al que se va a mandar la petición del cliente
 *  2. Enviar el mensaje al manejador elegido
 *  3. Crear el timeout por si nadie responde
 * @param {*} message
 */
function onClientMessage(request, from_timeout = false) {
  console.log(`client_rr: onClientMessage(${JSON.stringify(request)}, ${from_timeout})`)
  if (!from_timeout) {
    request_counter++;
    current_request_id = buildRequestId(client_id, request_counter);
  }
  handler_id = randSelectHandlerId();

  router_socket.send(JSON.stringify({
    from: client_id,
    to: handler_id,
    type: 'request',
    id: current_request_id,
    data: request
  }));

  timeoutTimer = setTimeout(onTimetoutExpired, 1000, request);
}

/**
 * Al recibier un mensaje del manejador debemos:
 *  1. Eliminar el timer del timeout
 *  2. Devolver la respuesta al cliente que la solicitó
 */
function onHandlerMessage(reply) {
  console.log(`client_rr: onHandlerMessage(${JSON.stringify(reply)})`)
  if (reply.to !== client_id) {
    console.error(`client_rr: El mensaje recibido del handler no se corresponde con el cliente actual`)
    return;
  }

  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }

  rr_socket.send(JSON.stringify(reply));
}

/**
 * Al agotarse el tiempo de espera debemos:
 *  1. Seleccionar otro handler distinto
 *  2. Enviar el mensaje de nuevo al nuevo handler
 */
function onTimetoutExpired(request) {
  console.log(`client_rr: onTimetoutExpired(${JSON.stringify(request)})`)
  onClientMessage(request, true);
}

process.on('SIGINT', function () {
  rr_socket.close();
  router_socket.disconnect();

  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }
});
