FROM active_replication/base
EXPOSE 6000
EXPOSE 7000
ENTRYPOINT node replica_router.js 6000 7000
