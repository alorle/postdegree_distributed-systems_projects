#!/bin/bash

# node client.js client1 2000 &
node client_rr.js client1 2000 3000 &
# node client.js client2 2001 &
node client_rr.js client2 2001 3000 &
# node client.js client3 2002 &
node client_rr.js client3 2002 3000 &

node client_router.js 3000 4000 &

node handler.js handler1 4000 5000 10000 10001 &
node handler.js handler2 4000 5000 10000 10001 &
node handler.js handler3 4000 5000 10000 10001 &

node replica_router.js 5000 6000 &

node replica.js replica1 6000 &
node replica.js replica2 6000 &
node replica.js replica3 6000 &

node to_sequencer.js 10000 10001 &
