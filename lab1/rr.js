var zmq = require('zmq');
var replyer = zmq.socket('rep');

//id_rr del parámetro
id_rr = process.argv[2];//Controlar que existe argv[2]

var list_handlers = []
var message;
replyer.bind("tcp://127.0.0.1:5555");

replyer.on("message", function request(msg){
    console.log(msg.toString());
    //replyer.send("Adios");
    message = msg.toString();
});

var requester = zmq.socket('dealer');
requester.identity = id_rr;
//Conectamos con el Router router
requester.connect("tcp://127.0.0.1:6666");

//Mandamos msg
requester.send(message);

//Esperamos respuesta
requester.on("message", function request(id, msg){
    replyer.send(msg.toString());
});
