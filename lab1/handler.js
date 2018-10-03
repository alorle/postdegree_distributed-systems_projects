const zmq = require('zeromq');

if (process.argv.length != 3) {
  console.error('Usage: node handler.js <ROUTER_PORT>');
  process.exit();
}

const ROUTER_ENDPOINT = `tcp://localhost:${process.argv[2]}`;

const handler = zmq.socket('dealer');
handler.identity = 'handler1';
handler.connect(ROUTER_ENDPOINT);
handler.monitor(100);

handler.on('connect', () => {
  console.log(`'${handler.identity}' connected to '${ROUTER_ENDPOINT}'`);
});

handler.on('message', (senderId, message) => {
  const msg = JSON.parse(message);
  console.log(`Message '${msg.data}' recieved from '${msg.from}'`);
});
