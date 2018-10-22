const zmq = require('zeromq');
var stdin = process.stdin;

if (process.argv.length !== 4) {
  console.error('Usage: node client.js <IDENTIFIER> <CLIENT_RR_PORT>');
  process.exit();
}

/**
 * ESTADO DEL CLIENTE
 */
const identity = process.argv[2];
const rr_host = 'localhost';
const rr_port = process.argv[3];
const rr_addr = `tcp://${rr_host}:${rr_port}`;

/**
 * Socket que conecta CLIENTE con RETRANSMISIÓN-REDIRECCIÓN
 */
const client_rr_socket = zmq.socket('req');
client_rr_socket.identity = identity;
client_rr_socket.connect(rr_addr);
client_rr_socket.on('message', (message) => onMessage(JSON.parse(message)));

/**
 * Atención de la respuesta
 */
function onMessage(rep) {
  console.log(`Message '${rep.data}' recieved from '${rep.from}'`);
};

stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', (key) => {
  if (key === '\u0003') {
    // ctrl-c ( end of text )
    console.log("Closing ...");
    client_rr_socket.close();
    process.exit();
  }

  key = key.slice(0, -1)
  if (key.length > 1) {

    console.log("Sending message: " + key);
    client_rr_socket.send(key);
  }
});
