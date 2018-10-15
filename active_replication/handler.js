const zmq = require('zeromq');

if (process.argv.length !== 5) {
  console.error('Usage: node handler.js <IDENTIFIER> <CLIENT_ROUTER_PORT> <REPLICA_ROUTER_PORT>');
  process.exit();
}

const IDENTITY = process.argv[2];
const CLIENT_ROUTER_PORT = process.argv[3];
const REPLICA_ROUTER_PORT = process.argv[4];

const client_side_socket = zmq.socket('dealer');
client_side_socket.identity = IDENTITY;
client_side_socket.connect(`tcp://localhost:${CLIENT_ROUTER_PORT}`);
client_side_socket.on('message', (senderId, message) => onClientRequest(JSON.parse(message)));

const replica_side_socket = zmq.socket('dealer');
replica_side_socket.identity = IDENTITY;
replica_side_socket.connect(`tcp://localhost:${REPLICA_ROUTER_PORT}`);
replica_side_socket.on('message', (senderId, message) => onReplicaReplay(JSON.parse(message)));

function onClientRequest(req) {
  if (req.to === IDENTITY) {
    console.log(`Message '${req.id}' recieved from '${req.from}' of type '${req.type}': ${JSON.stringify(req.data)}. Sending to all replicas...`);
    replica_side_socket.send(JSON.stringify(req));

    // TODO: solicitar orden total
    // TODO: enviar a todas las réplicas (por ahora solo mandamos a una)
  } else {
    console.error(`Message recieved for '${req.to}' but this is '${IDENTITY}'`)
  }
}

function onReplicaReplay(request) {
  console.log("onReplicaReplay")
}

function onToDeliver() {

}

process.on('SIGINT', function () {
  client_side_socket.close();
  replica_side_socket.close();
});
