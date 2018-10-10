
var zmq = require('zmq');
var requester = zmq.socket('req');
var id_cliente;

//id_cliente del parámetro
id_cliente = process.argv[2];//Controlar que existe argv[2]
requester.identity = id_cliente;
//Conectamos con el RR
requester.connect("tcp://127.0.0.1:5555");

//Mensaje a mandar
//console.log("Mensaje: ");
//var message = process.openStdin();
var message = "Hola caracola";

//Enviamos a RR
requester.send(message);

//Esperamos respuesta
requester.on("message", function request(msg){
    console.log(msg.toString());
});



