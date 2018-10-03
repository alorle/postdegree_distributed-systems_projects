const zmq = require('zeromq');
const utils = require('./utils');

if (process.argv.length !== 3) {
  console.error('Usage: node client.js <ROUTER_PORT>');
  process.exit();
}

const IDENTITY = utils.randString('client');
const ROUTER_ENDPOINT = `tcp://localhost:${process.argv[2]}`;

const client = zmq.socket('dealer');
client.identity = IDENTITY;
client.connect(ROUTER_ENDPOINT);
client.monitor(100);
client.on('connect', () => {
  console.log(`'${IDENTITY}' connected to '${ROUTER_ENDPOINT}'`);
  client.send(utils.buildClientMsg('handler1', client.identity, 'Hi Boss'));
});
