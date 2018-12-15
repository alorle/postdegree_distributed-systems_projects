base:
	docker build -f base.dockerfile . -t active_replication/base

client: base
	docker build -f client.dockerfile . -t active_replication/client

client_rr: base
	docker build -f client_rr.dockerfile . -t active_replication/client_rr

client_router: base
	docker build -f client_router.dockerfile . -t active_replication/client_router

handler: base
	docker build -f handler.dockerfile . -t active_replication/handler

replica_router: base
	docker build -f replica_router.dockerfile . -t active_replication/replica_router

replica: base
	docker build -f replica.dockerfile . -t active_replication/replica

to_sequencer: base
	docker build -f to_sequencer.dockerfile . -t active_replication/to_sequencer

all: client client_rr client_router handler replica_router replica to_sequencer

clean: down
	docker image rmi -f active_replication/base
	docker image rmi -f active_replication/client
	docker image rmi -f active_replication/client_rr
	docker image rmi -f active_replication/client_router
	docker image rmi -f active_replication/handler
	docker image rmi -f active_replication/replica_router
	docker image rmi -f active_replication/replica
	docker image rmi -f active_replication/to_sequencer

up: all
	docker-compose up -d
	docker-compose logs -f --no-color  replica1 | grep Processing > logs/replica1.log &
	docker-compose logs -f --no-color  replica2 | grep Processing > logs/replica2.log &
	docker-compose logs -f --no-color  replica3 | grep Processing > logs/replica3.log &

client1:
	node client.js client1 3001 2>&1 | tee logs/client1.log

client2:
	node client.js client2 3002 2>&1 | tee logs/client2.log

client3:
	node client.js client3 3003 2>&1 | tee logs/client3.log

down:
	docker-compose down
