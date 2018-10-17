var zmq = require('zmq');
var replyer = zmq.socket('rep');

//id_rr del parámetro
id_rr = process.argv[2];//Controlar que existe argv[2]

var list_handlers = ['handler1', 'handler2', 'handler3'];
var message;
replyer.bind("tcp://127.0.0.1:5555");

var requester = zmq.socket('dealer');
requester.identity = id_rr;
//Conectamos con el Router router
requester.connect("tcp://127.0.0.1:6666");

replyer.on("message", function request(msg){
    message = msg.toString();
    requester.send(JSON.stringify({'to': list_handlers[0], 'from': requester.identity, 'msg': message}));
});


//Esperamos respuesta
requester.on("message", function request(id, msg){
    replyer.send(msg.toString());
});
