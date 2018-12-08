FROM active_replication/base
EXPOSE 4000
EXPOSE 5000
ENTRYPOINT node client_router.js 4000 5000
