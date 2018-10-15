var zmq = require('zmq');
var socket_client = zmq.socket('router');
//Conectamos con el Router router
socket_client.bindSync("tcp://127.0.0.1:6666");
socket_client.identity = "router_client";

var socket_handler = zmq.socket('router');
//Conectamos con el Router router
socket_handler.identity = "router_handler";
socket_handler.bind("tcp://127.0.0.1:7777");



//Esperamos respuesta del socket_client
socket_client.on("message", function request(id, msg){
    console.log("socket_client:");
    console.log(id.toString());
    message = JSON.parse(msg.toString());
    console.log(message['msg']);
    console.log(message['to']);
    //socket_handler.send([msg['to'], socket_handler.identity, message['msg']]);
    socket_handler.send(['handler1', socket_handler.identity, 'holiiii']);
});


//Esperamos respuesta del socket_handler
socket_handler.on("message", function request(id, msg){
    console.log("socket_handler:");
    console.log(msg.toString());
    socket_client.send([id, socket_client.identity, msg.toString()]);
});