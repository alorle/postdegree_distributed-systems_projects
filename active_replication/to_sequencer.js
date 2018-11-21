const zmq = require('zeromq');

if (process.argv.length !== 4) {
  console.error('Usage: node to_sequencer.js <ROUTER_PORT> <PUB_PORT>');
  process.exit();
}

/**
 * TO Sequencer state
 */
const identity = 'TOSequencer';
let next_seq = 1;
const requests = [];

const router_host = '*';
const router_port = process.argv[2];
const router_addr = `tcp://${router_host}:${router_port}`;

const pub_host = '*';
const pub_port = process.argv[3];
const pub_addr = `tcp://${pub_host}:${pub_port}`;

const LOG_TAG = `CLIENT[${identity}]`;

const router = zmq.socket('router');
router.identity = identity;
router.bind(router_addr);
router.on('message', (senderId, message) => onTODeliver(JSON.parse(message)));

const publisher = zmq.socket('pub');
publisher.identity = identity;
publisher.bind(pub_addr);

function onTODeliver(query) {
  if (query.type === 'get_seq') {
    const id = query.req.id;
    if (getReqById(id) === null) {
      requests.push({ ...query.req, seq: next_seq });
      next_seq += 1;
    }

    console.log(`${LOG_TAG} - Publishing 'TOCast ${JSON.stringify(getReqById(id))}'`);
    publisher.send(`TOCast ${JSON.stringify(getReqById(id))}`);
  } else if (query.type === 'get_req') {
    router.send([query.from, identity, getReqBySeq(query.seq)]);
  }
}

/**
 * Return request with given id if exists.
 *
 * @param {number} id
 * @returns {request | null}
 */
function getReqById(id) {
  const candidates = requests.filter(r => r.id === id);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

/**
 * Return request with given sequence if exists.
 *
 * @param {number} seq
 * @returns {request | null}
 */
function getReqBySeq(seq) {
  const candidates = requests.filter(r => r.seq === seq);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

process.on('SIGINT', function () {
  console.log(`${LOG_TAG} - Closing ...`);
  router.close();
  publisher.close();
});
