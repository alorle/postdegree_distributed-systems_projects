# lab1

Basic example of communication between a **_client_** and a **_handler_** through a **_midelware_**.

Both endpoints, client and handler, implements a `dialer` socket from [ØMQ](http://zeromq.org/). On the other hand, the midelware implements two sockets, both of type `router`, one for the incomming messages from the client, called `outer_router`, and the other for the outgoing messages for the handler, called `inner_router`.

The goal of this practice is to be able to run a simple architecture based on the router-router communication  paradigm.

# Usage

Before any script can be executed, all dependencies must be installed:
```bash
npm i
```

Now you can execute any of the three scripts provided:

* Client:
```bash
npm run client <OUTER_ROUTER_PORT>
```

* Handler:
```bash
npm run handler <INNER_ROUTER_PORT>
```

* Midelware:
```bash
npm run rr_mid <OUTER_ROUTER_PORT> <INNER_ROUTER_PORT>
```
