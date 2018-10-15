const zmq = require('zeromq');

if (process.argv.length !== 4) {
  console.error('Usage: node replica.js <IDENTIFIER> <ROUTER_PORT>');
  process.exit();
}

const IDENTITY = process.argv[2];
const ROUTER_PORT = process.argv[3];

const router_socket = zmq.socket('dealer');
router_socket.identity = IDENTITY;
router_socket.connect(`tcp://localhost:${ROUTER_PORT}`);
router_socket.on('message', (senderId, message) => onClientRequest(JSON.parse(message)));

function onClientRequest(req) {
  console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${JSON.stringify(req.data)}`);

  if (req.data.message === 'Hola') {
    router_socket.send(JSON.stringify({
      from: IDENTITY,
      to: req.from,

      message: "Adios"
    }))
  }
}

process.on('SIGINT', function () {
  client_side_socket.close();
  router_socket.close();
});
