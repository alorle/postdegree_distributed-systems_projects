const zmq = require('zeromq');

if (process.argv.length != 4) {
  console.error('Usage: node client_rr.js <CLIENT_RR_PORT> <CLIENT_ROUTER_PORT>');
  process.exit();
}

/**
 * ESTADO DEL RETRANSMISIÓN-REDIRECCIÓN
 */
let client_id = 'client1';
let request_counter = 0;
let current_request_id = null;
let handler_id = null;
let timeoutTimer = null;

const rr_host = '*';
const rr_port = process.argv[2];
const rr_addr = `tcp://${rr_host}:${rr_port}`;

const handler_router_host = 'localhost';
const handler_router_port = process.argv[3];
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

/**
 * Socket expuesto hacia CLIENTE
 */
const rr_socket = zmq.socket('rep');
rr_socket.bind(rr_addr);
rr_socket.on('message', (message) => onClientMessage(JSON.parse(message)));

/**
 * Socket que conecta RETRANSMISIÓN-REDIRECCIÓN con HANDLER_ROUTER
 */
const handler_router_socket = zmq.socket('dealer');
handler_router_socket.identity = client_id;
handler_router_socket.connect(handler_router_addr);
handler_router_socket.on('message', (senderId, message) => onHandlerMessage(JSON.parse(message)));

/**
 * Constructor del ID del REQUEST
 *
 * @param string client id
 * @param uint requests count
 */
function buildRequestId(client, count) {
  return `${client}::${count}`
}

/**
 * Selección aleatoria del HANDLER para atender a CLIENTE
 */
function randSelectHandlerId() {
  return 'handler1';
}

/**
 * Al recibir un mensaje de CLIENTE se debe:
 *  1. Seleccionar HANDLER al que se va a mandar la REQUEST de CLIENT
 *  2. Enviar el mensaje al HANDLER elegido
 *  3. Crear el timeout por si nadie responde
 *
 * @param JSON client request
 * @param boolean whether calling from timeout function
 */
function onClientMessage(request, from_timeout = false) {
  if (!from_timeout) {
    request_counter++;
    current_request_id = buildRequestId(client_id, request_counter);
  }
  handler_id = randSelectHandlerId();

  handler_router_socket.send(JSON.stringify({
    from: client_id,
    to: handler_id,
    type: 'request',
    id: current_request_id,
    data: request
  }));

  timeoutTimer = setTimeout(onTimetoutExpired, 1000, request);
}

/**
 * Al recibir un mensaje de HANDLER se debe:
 *  1. Eliminar el timer del timeout
 *  2. Devolver la respuesta al CLIENTE que la solicitó
 */
function onHandlerMessage(reply) {
  if (reply.to !== client_id) {
    console.error(`El mensaje recibido del handler no se corresponde con el cliente actual`)
    return;
  }

  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }

  rr_socket.send(JSON.stringify(reply));
}

/**
 * Al agotarse el tiempo de espera debemos:
 *  1. Seleccionar otro HANDLER distinto
 *  2. Enviar el mensaje de nuevo al nuevo HANDLER
 */
function onTimetoutExpired(request) {
  console.log(`Tiempo de espera de la petición '${request.id}' agotado`)
  onClientMessage(request, true);
}

process.on('SIGINT', function () {
  console.log("Closing ...");
  rr_socket.close();
  handler_router_socket.close();

  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }
});
