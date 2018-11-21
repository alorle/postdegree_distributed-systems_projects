const zmq = require('zeromq');

if (process.argv.length !== 7) {
  console.error('Usage: node handler.js <IDENTIFIER> <CLIENT_ROUTER_PORT> <REPLICA_ROUTER_PORT> <SEQUENCER_ROUTER_PORT> <SEQUENCER_SUBSCRIBER_PORT>');
  process.exit();
}

/**
 * ESTADO DEL HANDLER
 */
const identity = process.argv[2];
let last_served_request = 0;
const requests = [];

const handler_router_host = 'localhost';
const handler_router_port = process.argv[3];
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

const replica_router_host = 'localhost';
const replica_router_port = process.argv[4];
const replica_router_addr = `tcp://${replica_router_host}:${replica_router_port}`;

const sequencer_router_host = 'localhost';
const sequencer_router_port = process.argv[5];
const sequencer_router_addr = `tcp://${sequencer_router_host}:${sequencer_router_port}`;

const sequencer_subscriber_host = 'localhost';
const sequencer_subscriber_port = process.argv[6];
const sequencer_subscriber_addr = `tcp://${sequencer_subscriber_host}:${sequencer_subscriber_port}`;

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
function onRequest(senderId, req) {
  if (req.to === identity) {
    console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${req.data}`);
    const seq = getSeq(req);

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
  } else {
    console.error(`Message recieved for '${req.to}' but this is '${identity}'`);
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

  const req = { ...getReqById(rep.id) };
  if (req !== null) {
    rep.to = req.from;
    rep.from = identity;
    handler_router_socket.send(JSON.stringify(rep));
  }
}

/**
 * Almacenar la petición con el orden de secuencia dado
 *
 * @param {*} to_request
 */
function onTOCast(to_request) {
  requests.push(to_request);

  // TODO: realizar envios pendientes
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
