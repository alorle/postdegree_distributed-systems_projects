const zmq = require('zeromq');

if (process.argv.length !== 4) {
  console.error('Usage: node client.js <IDENTIFIER> <CLIENT_RR_PORT>');
  process.exit();
}

const IDENTITY = process.argv[2];
const CLIENT_RR_PORT = process.argv[3];

const rr_socket = zmq.socket('req');
rr_socket.identity = IDENTITY;
rr_socket.connect(`tcp://localhost:${CLIENT_RR_PORT}`);
rr_socket.on('message', (message) => onMessage(JSON.parse(message)));
rr_socket.send("Hola");

function onMessage() {
  console.log(`Message '${msg.data}' recieved from '${msg.from}'`);
};

process.on('SIGINT', function () {
  rr_socket.disconnect();
});
