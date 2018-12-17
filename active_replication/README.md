# Active Replication

_Autores:_ Ana Molina, Alberto Maíllo, Ismael Muñoz y Álvaro Orduna

## Requerimientos
```
node
npm
make
docker
docker-compose
```

## Lanzamiento automático con Docker

La implementación realizada permite la ejecución del sistema mediante `docker` y `docker-compose`. Para poder ejecutar en este modo, basta con levantar por un lado el sistema interno (todo menos los clientes) y los clientes por otro.

1. Construir las imágenes de los distintos componentes:
```
make all
```
2. Leventar el sistema completo (sin clientes):
```
docker-compose up -d
```
3. Mostrar logs de uno de los elementos del sistema:
```
docker-compose logs -f --no-color <nombre del componente>
```
donde `nombre del componente` puede ser uno de

* to_sequencer
* client_router
* replica_router
* client_rr1
* client_rr2
* client_rr3
* client_rr4
* handler1
* handler2
* handler3
* replica1
* replica2
* replica3

4. Lanzar cada cliente por separado:
```
make client1
make client2
make client3
make client4
```

## Lanzamiento manual

1. `node client_rr.js client1 2001 3000`
1. `node client_rr.js client2 2002 3000`
1. `node client_rr.js client3 2003 3000`
1. `node client_rr.js client4 2004 3000`
1. `node client_router.js 3000 4000`
1. `node handler.js handler1 4000 5000 10000 10001`
1. `node handler.js handler2 4000 5000 10000 10001`
1. `node handler.js handler3 4000 5000 10000 10001`
1. `node replica_router.js 5000 6000`
1. `node replica.js replica1 6000`
1. `node replica.js replica2 6000`
1. `node replica.js replica3 6000`
1. `node to_sequencer.js 10000 10001`
1. `node client.js client1 3001`
1. `node client.js client2 3002`
1. `node client.js client3 3003`
1. `node client.js client4 3004`
