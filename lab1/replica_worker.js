var zmq = require('zmq');

var requester = zmq.socket('dealer');
requester.identity = "replica1";
requester.connect("tcp://127.0.0.1:9999");

requester.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    message_msg = JSON.parse(message["msg"]);
    console.log(message_msg["msg"]);
    message_send = JSON.stringify({'to': message_msg['from'], 'from': message_msg['to'], 'msg': "Adios"})
    requester.send(JSON.stringify({'to': message['from'], 'from': requester.identity, 'msg':message_send}));
});
