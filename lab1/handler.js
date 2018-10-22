var zmq = require('zmq');

var requester = zmq.socket('dealer');
requester.identity = "handler1";
requester.connect("tcp://127.0.0.1:7777");


var replyer = zmq.socket('dealer');
replyer.identity = "handler1";
replyer.connect("tcp://127.0.0.1:8888");

var list_replicas = ['replica1', 'replica2', 'replica3'];

requester.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    console.log(message["from"]);
    replyer.send(JSON.stringify({'to': list_replicas[0], 'from': requester.identity, 'msg': msg.toString()}));
    
});


replyer.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    message_msg = JSON.parse(message['msg']);
    console.log(msg.toString());
    requester.send(JSON.stringify({'to': message_msg['to'], 'from': message_msg["from"], 'msg': message_msg["msg"]}));
});