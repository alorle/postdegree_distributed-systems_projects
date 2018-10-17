const zmq = require('zeromq');

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
client_rr_socket.on('message', (senderId, message) => onMessage(JSON.parse(message)));

/**
 * Atención de la respuesta
 */
function onMessage() {
  console.log(`Message '${msg.data}' recieved from '${msg.from}'`);
};

process.on('SIGINT', function () {
  console.log("Closing ...");
  client_rr_socket.close();
});

/**
 * Envío del primer mensaje de CLIENTE
 */
client_rr_socket.send("Hola");
