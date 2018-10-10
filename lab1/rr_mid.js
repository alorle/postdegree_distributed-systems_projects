var zmq = require('zmq');
var replyer = zmq.socket('router');
//Conectamos con el Router router
replyer.bindSync("tcp://127.0.0.1:6666");
replyer.identity = "rr1111111";
//Esperamos respuesta
replyer.on("message", function request(id, msg){
    replyer.send([id, replyer.identity, "Adios"]);
});