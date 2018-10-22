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
    message = JSON.parse(msg.toString());
    console.log(msg.toString());
    socket_handler.send([message['to'], '', msg.toString()]);
});


//Esperamos respuesta del socket_handler
socket_handler.on("message", function request(id, msg){
    message = JSON.parse(msg.toString());
    console.log(msg.toString());
    id_rr = message['to'].split('_');
    socket_client.send([id_rr[0], '', message['msg']]);
});