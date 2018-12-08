FROM active_replication/base
EXPOSE 3000
ENTRYPOINT node client_rr.js client 3000 4000
