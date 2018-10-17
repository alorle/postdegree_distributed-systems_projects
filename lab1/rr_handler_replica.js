var zmq = require('zmq');
var socket_replica = zmq.socket('router');
//Conectamos con el Router router
socket_replica.bindSync("tcp://127.0.0.1:9999");
socket_replica.identity = "router_replica";

var socket_handler = zmq.socket('router');
//Conectamos con el Router router
socket_handler.identity = "router_handler_replica";
socket_handler.bind("tcp://127.0.0.1:8888");



//Esperamos respuesta del socket_client
socket_replica.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    socket_handler.send([message['to'], '', msg.toString()]);
    //socket_handler.send(JSON.stringify({'to': message['to'], 'from': requester.identity, 'msg': msg.toString()}));
});


//Esperamos respuesta del socket_handler
socket_handler.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    socket_replica.send(['replica1', '', msg.toString()]);
});