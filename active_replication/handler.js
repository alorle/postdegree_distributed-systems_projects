const zmq = require('zeromq');
const replicas = require('./elements').replicas;

const HANDLER_ID = process.env.HANDLER_ID || process.argv[2];
const CLIENTS_PORT = process.env.CLIENTS_PORT || process.argv[3];
const REPLICAS_PORT = process.env.REPLICAS_PORT || process.argv[4];
const TO_ROUTER_PORT = process.env.TO_ROUTER_PORT || process.argv[5];
const TO_SUBSCRIBER_PORT = process.env.RR_PORT || process.argv[6];

if (HANDLER_ID === undefined || HANDLER_ID == null || HANDLER_ID.length === 0
  || CLIENTS_PORT === undefined || CLIENTS_PORT == null
  || REPLICAS_PORT === undefined || REPLICAS_PORT == null
  || TO_ROUTER_PORT === undefined || TO_ROUTER_PORT == null
  || TO_SUBSCRIBER_PORT === undefined || TO_SUBSCRIBER_PORT == null) {
  console.error('Usage: node handler.js <HANDLER_ID> <CLIENTS_PORT> <REPLICAS_PORT> <TO_ROUTER_PORT> <TO_SUBSCRIBER_PORT>');
  process.exit();
}

/**
 * ESTADO DEL HANDLER
 */
const identity = HANDLER_ID;
let last_served_request = 0;
const requests = [];

const handler_router_host = 'client_router';
const handler_router_port = CLIENTS_PORT;
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

const replica_router_host = 'replica_router';
const replica_router_port = REPLICAS_PORT;
const replica_router_addr = `tcp://${replica_router_host}:${replica_router_port}`;

const sequencer_router_host = 'to_sequencer';
const sequencer_router_port = TO_ROUTER_PORT;
const sequencer_router_addr = `tcp://${sequencer_router_host}:${sequencer_router_port}`;

const sequencer_subscriber_host = 'to_sequencer';
const sequencer_subscriber_port = TO_SUBSCRIBER_PORT;
const sequencer_subscriber_addr = `tcp://${sequencer_subscriber_host}:${sequencer_subscriber_port}`;

const LOG_TAG = `HANDLER[${identity}]`;

console.log(`${LOG_TAG} - Request from ${handler_router_addr}, will be send to ${replica_router_addr} (TO: ${sequencer_router_addr} and ${sequencer_subscriber_addr})`);

const handler_router_socket = zmq.socket('dealer');
handler_router_socket.identity = identity;
handler_router_socket.connect(handler_router_addr);
handler_router_socket.on('message', (senderId, message) => onRequest(senderId, JSON.parse(message)));

const replica_router_socket = zmq.socket('dealer');
replica_router_socket.identity = identity;
replica_router_socket.connect(replica_router_addr);
replica_router_socket.on('message', (senderId, message) => onTOReplay(senderId, JSON.parse(message)));

const to_dealer = zmq.socket('dealer');
to_dealer.identity = identity;
to_dealer.connect(sequencer_router_addr);

const to_subscriber = zmq.socket('sub');
to_subscriber.identity = identity;
to_subscriber.connect(sequencer_subscriber_addr);
to_subscriber.subscribe('TOCast');
to_subscriber.on('message', (message) => onTOCast(JSON.parse(message.toString().replace('TOCast ', ''))));

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
function onRequest(senderId, req) {
  if (req.to === identity) {
    console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${req.data}`);
    const seq = getSeq(req);
    console.log(`Seq of meesage with id '${req.id}': ${seq}`);
    attendPendingRequests(seq);
  } else {
    console.error(`Message recieved for '${req.to}' but this is '${identity}'`);
  }
}

function attendPendingRequests(seq) {
  console.log(`¿¿${seq} > ${last_served_request}??`);
  if (seq > last_served_request) {
    for (let i = last_served_request + 1; i <= seq; i++) {
      const pending = { ...getReq(i) };
      pending.from = identity;

      console.log(`Message '${pending.id}' recieved from '${pending.from}' of type '${pending.type}': ${pending.data}. Sending to all replicas`);
      replicas.forEach((replica) => {
        pending.to = replica;
        replica_router_socket.send(JSON.stringify(pending));
      });
    }

    last_served_request = Math.max(last_served_request, seq);
  }
}

/**
 * Al recibir una respuesta de REPLICA, retransmitir la respuesta a solicitante
 *
 * @param string sender id
 * @param JSON replay
 */
function onTOReplay(senderId, rep) {
  console.log(`Message '${rep.id}' recieved from '${rep.from}' of type '${rep.type}': ${rep.data}`);

  const req = getReqById(rep.id);
  if (req !== null && !req.replayed) {
    if (req.to === identity) {
      rep.to = req.from;
      rep.from = identity;
      rep.trace[`output_${identity}`] = new Date().valueOf();
      req.replayed = true;
      handler_router_socket.send(JSON.stringify(rep));
    }
  }
}

/**
 * Almacenar la petición con el orden de secuencia dado
 *
 * @param {*} to_request
 */
function onTOCast(to_request) {
  to_request.trace[`input_${identity}`] = new Date().valueOf();

  var index = requests.findIndex(function (element) {
    return element.client_id === to_request.client_id;
  });

  console.log('index: ' + index);
  if (index == -1) {
    // Si no tenemos guardado el cliente, lo guardamos
    requests.push(to_request);

    if (to_request.to == identity) {
      attendPendingRequests(to_request.seq);
    }
  }
  else {
    // Tenemos el cliente, comprobamos su número de secuencia
    if (to_request.client_seq > requests[index].client_seq) {
      // El nuevo número de secuencia es mayor al que tenemos, lo actualizamos
      requests[index] = to_request;

      if (to_request.to == identity) {
        attendPendingRequests(to_request.seq);
      }
    }
    // Si es menor, el handler tiene la capacidad de ignorar la solicitud.
  }
  console.log(requests);
}

/**
 * Si la petición está secuenciada, devolver el orden total, si no,
 * solicitar la secuenciación al sequencer
 *
 * @param {*} req
 */
function getSeq(req) {
  const candidate = getReqById(req.id);
  if (candidate !== null) {
    return candidate.seq;
  }

  // Como la petición no está secuenciada, pedir al TO que la secuencie
  to_dealer.send(JSON.stringify({
    type: 'get_seq',
    req: req,
    from: identity
  }));

  return -1;
}

/**
 * Extrar la petición del array de peticiones
 *
 * @param {*} seq
 */
function getReq(seq) {
  return getReqBySeq(seq);
}

/**
 * Return request with given id if exists.
 *
 * @param {number} id
 * @returns {request | null}
 */
function getReqById(id) {
  const candidates = requests.filter(r => r.id === id);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

/**
 * Return request with given sequence if exists.
 *
 * @param {number} seq
 * @returns {request | null}
 */
function getReqBySeq(seq) {
  const candidates = requests.filter(r => r.seq === seq);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

process.on('SIGINT', function () {
  handler_router_socket.close();
  replica_router_socket.close();
  to_dealer.close();
  to_subscriber.close();
});
