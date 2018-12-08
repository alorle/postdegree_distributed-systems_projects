const zmq = require('zeromq');
const handlers_ids = require('./elements').handlers;

const CLIENT_ID = process.env.CLIENT_ID || process.argv[2];
const CLIENT_PORT = process.env.CLIENT_PORT || process.argv[3];
const HANDLERS_PORT = process.env.HANDLERS_PORT || process.argv[4];

if (CLIENT_ID == undefined || CLIENT_ID === null || CLIENT_ID.length === 0
  || CLIENT_PORT == undefined || CLIENT_PORT === null
  || HANDLERS_PORT == undefined || HANDLERS_PORT === null) {
  console.error('Usage: node client_rr.js <CLIENT_ID> <CLIENT_PORT> <HANDLERS_PORT>');
  process.exit();
}

/**
 * RETRANSMISSION-REDIRECTION state
 */
const client_id = CLIENT_ID;
let request_counter = 0;
let current_request_id = null;
let handler_id = null;
let timeoutTimer = null;
let timeoutMillis = 10000;

const rr_host = '*';
const rr_port = CLIENT_PORT;
const rr_addr = `tcp://${rr_host}:${rr_port}`;

const handler_router_host = 'client_router';
const handler_router_port = HANDLERS_PORT;
const handler_router_addr = `tcp://${handler_router_host}:${handler_router_port}`;

const LOG_TAG = `RR[${client_id}]`;

console.log(`${LOG_TAG} - Listening on ${rr_addr}, will send requests to ${handler_router_addr}`);

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
  return handlers_ids[Math.floor(Math.random() * (handlers_ids.length))];
}

function onRequest(message, from_timeout = false) {
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
    data: message,
    trace: {
      [`input_${client_id}`]: new Date().valueOf(),
    }
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

  console.log(`${LOG_TAG} - Replay recieved from '${rep.from}' with id '${rep.id}'`);
  rep.trace[`output_${client_id}`] = new Date().valueOf();
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
