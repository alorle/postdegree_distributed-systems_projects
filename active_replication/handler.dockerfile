FROM active_replication/base
ENTRYPOINT node handler.js handler 5000 6000 10000 10001
