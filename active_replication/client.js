const zmq = require('zeromq');
const stdin = process.stdin;

if (process.argv.length !== 4) {
  console.error('Usage: node client.js <CLIENT_ID> <RETRANSMISSION-REDIRECTION_PORT>');
  process.exit();
}

/**
 * CLIENT state
 */
const identity = process.argv[2];
const socket_addr = `tcp://localhost:${process.argv[3]}`;
const LOG_TAG = `CLIENT[${identity}]`;
console.log(`Client '${identity}' will be connected to '${socket_addr}'`);

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
  console.log(`${LOG_TAG} - Replay recieved from '${rep.from}':`, rep.data);
}

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
