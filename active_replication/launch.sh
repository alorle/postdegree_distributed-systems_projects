#!/bin/bash

# # node client.js client1 2000 &
# node client_rr.js client1 2000 3000 &
# # node client.js client2 2001 &
# node client_rr.js client2 2001 3000 &
# # node client.js client3 2002 &
# node client_rr.js client3 2002 3000 &

# node client_router.js 3000 4000 &

# node handler.js handler1 4000 5000 10000 10001 &
# node handler.js handler2 4000 5000 10000 10001 &
# node handler.js handler3 4000 5000 10000 10001 &

# node replica_router.js 5000 6000 &

# node replica.js replica1 6000 &
# node replica.js replica2 6000 &
# node replica.js replica3 6000 &

# node to_sequencer.js 10000 10001 &

node client.js client1 3001 &
node client.js client2 3002 &
node client.js client3 3003
# node client.js client4 3004 &
# node client.js client5 3005 &
# node client.js client6 3006 &
# node client.js client7 3007 &
# node client.js client8 3008 &
# node client.js client9 3009 &
# node client.js client10 3010 &
