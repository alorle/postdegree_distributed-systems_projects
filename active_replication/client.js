const zmq = require('zeromq');
const stdin = process.stdin;

const CLIENT_ID = process.env.CLIENT_ID || process.argv[2];
const RR_PORT = process.env.RR_PORT || process.argv[3];
const AUTO_MODE = process.env.AUTO_MODE || true;

if (CLIENT_ID == undefined || CLIENT_ID === null || CLIENT_ID.length === 0
  || RR_PORT == undefined || RR_PORT === null) {
  console.error('Usage: node client.js <CLIENT_ID> <RR_PORT>');
  process.exit();
}

/**
 * CLIENT state
 */
const identity = CLIENT_ID;
const socket_addr = `tcp://localhost:${RR_PORT}`;
const LOG_TAG = `CLIENT[${identity}]`;
let lastMsg;
let lastSendTimestamp;
// console.log(`Client '${identity}' will be connected to '${socket_addr}'`);

/**
 * Connect CLIENT with RETRANSMISSION-REDIRECTION
 */
const socket = zmq.socket('req');
socket.identity = identity;
socket.connect(socket_addr);
socket.on('message', (message) => onReplay(JSON.parse(message)));

/**
 * Process replay
 */
function onReplay(rep) {
  const lastReplayTimestamp = Date.now().valueOf();
  console.log(`${lastMsg} ${lastSendTimestamp} ${rep.data} ${lastReplayTimestamp} ${lastReplayTimestamp - lastSendTimestamp}`);
  // showTrace(rep.trace);
  setTimeout(send, 2000);
}

// function showTrace(trace) {
//   trace = Object.keys(trace).map((key) => `${trace[key]} - ${new Date(trace[key])} -> ${key}`);
//   console.log('Trace:');
//   trace.forEach(t => console.log(` - ${t}`));
// }

function createRandomString(length) {
  let str = '';
  for (; str.length < length; str += Math.random().toString(36).substr(2));
  return str.substr(0, length);
}

function send() {
  const msg = createRandomString(20);
  const date = Date.now();
  lastMsg = msg;
  lastSendTimestamp = date.valueOf();
  socket.send(msg);
}

if (AUTO_MODE) {
  send();
} else {
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => {
    if (key === '\u0003') {
      // ctrl-c ( end of text )
      console.log(`${LOG_TAG} - Closing ...`);
      socket.close();
      process.exit();
    }

    key = key.slice(0, -1);
    if (key.length > 1) {
      console.log(`${LOG_TAG} - Sending request:`, key);
      socket.send(key);
    }
  });
}
