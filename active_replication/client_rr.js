const zmq = require('zeromq');
const handlers_ids = require('./elements').handlers;

if (process.argv.length != 5) {
  console.error('Usage: node client_rr.js <IDENTITY> <CLIENT_PORT> <HANDLER_ROUTER_PORT>');
  process.exit();
}

/**
 * RETRANSMISSION-REDIRECTION state
 */
const client_id = process.argv[2];
let request_counter = 0;
let current_request_id = null;
let handler_id = null;
let timeoutTimer = null;
let timeoutMillis = 10000;

const rr_host = '*';
const rr_port = process.argv[3];
const rr_addr = `tcp://${rr_host}:${rr_port}`;

const handler_router_host = 'localhost';
const handler_router_port = process.argv[4];
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

const LOG_TAG = `RR[${client_id}]`;

/**
 * CLIENT socket
 */
const client = zmq.socket('rep');
client.bind(rr_addr);
client.on('message', (message) => onRequest(message.toString()));

/**
 * HANDLERS socket
 */
const handlers = zmq.socket('dealer');
handlers.identity = client_id;
handlers.connect(handler_router_addr);
handlers.on('message', (senderId, message) => onReplay(JSON.parse(message)));

/**
 * Request id builder
 */
function buildRequestId(client, count) {
  return `${client}::${count}`;
}

/**
 * Random selection of a handler
 */
function randSelectHandlerId() {
  return handlers_ids[Math.floor(Math.random() * (handlers_ids.length - 1))];
}

function onRequest(message, from_timeout = false) {
  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  if (!from_timeout) {
    console.log(`${LOG_TAG} - Message recieved: '${message}'`);
    request_counter++;
    current_request_id = buildRequestId(client_id, request_counter);
  } else {
    clearTimeout(timeoutTimer);
  }
  handler_id = randSelectHandlerId();

  const req = {
    from: client_id,
    to: handler_id,
    type: 'request',
    id: current_request_id,
    client_id: client_id,
    client_seq: request_counter,
    data: message
  };
  handlers.send(JSON.stringify(req));
  console.log(`${LOG_TAG} - Request send to '${handler_id}' with id '${current_request_id}'`);

  timeoutTimer = setTimeout(onTimetoutExpired, timeoutMillis, message);
}

function onReplay(rep) {
  if (rep.to !== client_id) {
    console.error(`${LOG_TAG} - Replay recieved is not for this client`);
    return;
  }

  if (rep.id !== current_request_id) {
    console.error(`${LOG_TAG} - Replay recieved is not the expected one: expected(${current_request_id}) <> recieved(${rep.id})`);
    return;
  }

  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }

  console.log(`${LOG_TAG} - Replay recieved from '${rep.from}' with id '${rep.id}'`, rep);
  client.send(JSON.stringify(rep));
}

function onTimetoutExpired(message) {
  console.error(`${LOG_TAG} - Request timeout for '${message}' message`);
  onRequest(message, true);
}

process.on('SIGINT', function () {
  console.log(`${LOG_TAG} - Closing ...`);
  client.close();
  handlers.close();
  if (timeoutTimer != undefined && timeoutTimer !== null) {
    clearTimeout(timeoutTimer);
  }
});
