var zmq = require('zmq');

var requester = zmq.socket('dealer');
requester.connect("tcp://127.0.0.1:7777");
requester.identity = "handler1";

requester.on("message", function request(id, msg){
    console.log("handler1:");
    console.log(msg.toString());
    requester.send([id, requester.identity, "Adios"]);
});