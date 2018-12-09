const zmq = require('zeromq');
const handlers = require('./elements').handlers;

const REPLICA_ID = process.env.REPLICA_ID || process.argv[2];
const HANDLERS_PORT = process.env.HANDLERS_PORT || process.argv[3];

if (REPLICA_ID == undefined || REPLICA_ID === null || REPLICA_ID.length === 0
  || HANDLERS_PORT == undefined || HANDLERS_PORT === null) {
  console.error('Usage: node replica.js <REPLICA_ID> <HANDLERS_PORT>');
  process.exit();
}

/**
 * ESTADO DEL REPLICA
 */
const identity = REPLICA_ID;
const replica_router_host = 'replica_router';
const replica_router_port = HANDLERS_PORT;
const replica_router_addr = `tcp://${replica_router_host}:${replica_router_port}`;

const LOG_TAG = `REPLICA[${identity}]`;

console.log(`${LOG_TAG} - Request from ${replica_router_addr} will be replied`);

let next_request = 1;
const requests_map = new Map();

/**
 * Socket que conecta REPLICA con REPLICA_ROUTER
 */
const router_socket = zmq.socket('dealer');
router_socket.identity = identity;
router_socket.connect(replica_router_addr);
router_socket.on('message', (senderId, message) => onTORequest(senderId, JSON.parse(message)));

/**
 * Al recibir una petición de CLIENTE
 * @param {*} req
 */
function onTORequest(senderId, req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${req.data}`);

  if (!requests_map.has(req.seq)) {
    // Si es la primera vez que ve la petición, almacenarla en el mapa de peticiones
    console.log(`Message '${req.id}' stored in requests map`);
    req.trace[`input_${identity}`] = new Date().valueOf();

    // Comprobamos si tenemos una petición anterior del cliente
    var mapIter = requests_map.entries();
    var notFound = true;

    while (notFound) {
      var map = mapIter.next().value;
      console.log(map);

      if (map != undefined) {
        console.log(map[1].client_seq);
        console.log(req.client_seq);
        if (map[1].client_id == req.client_id && map[1].client_seq < req.client_seq) {
          // Borramos la vieja
          requests_map.delete(map[0]);
          notFound = false;
        }
      }
      else
        notFound = false;
    }

    requests_map.set(req.seq, req);

    console.log('Listado de peticiones en las réplicas:');
    console.log(requests_map);
  }
  else {
    console.log(`Message '${req.id}' already in requests map`);
    const stored_req = requests_map.get(req.seq);

    // Si ya se ha recibido la petición anteriormente, comprobar si ha sido procesada
    if (typeof (stored_req.replay) != undefined) {
      // La petición ha sido procesada con anterioridad, así que se debe reenviar la respuesta
      sendTOReplay(stored_req.replay);
    }
  }

  // Procesamos todas las peticiones pendientes
  while (requests_map.has(next_request)) {
    const processing_req = requests_map.get(next_request);

    console.log(`Processing message '${processing_req.id}'`);
    processing_req.replay = {
      id: processing_req.id,
      from: identity,
      to: processing_req.from,
      type: 'replay',
      data: processing_req.data.split('').reverse().join(''),
      trace: processing_req.trace
    };

    sendTOReplay(processing_req.replay);
    requests_map.set(processing_req.seq, processing_req);
    next_request++;
  }
}

function sendTOReplay(rep) {
  console.log(`Replaying to all handlers ${rep.id}`);
  handlers.forEach((handler) => {
    rep.to = handler;
    rep.trace[`output_${identity}`] = new Date().valueOf();
    router_socket.send(JSON.stringify(rep));
  });
}

process.on('SIGINT', function () {
  console.log('Closing ...');
  router_socket.close();
});
