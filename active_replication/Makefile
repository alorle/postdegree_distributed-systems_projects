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

clean:
	docker image rmi -f active_replication/base
	docker image rmi -f active_replication/client
	docker image rmi -f active_replication/client_rr
	docker image rmi -f active_replication/client_router
	docker image rmi -f active_replication/handler
	docker image rmi -f active_replication/replica_router
	docker image rmi -f active_replication/replica
	docker image rmi -f active_replication/to_sequencer
