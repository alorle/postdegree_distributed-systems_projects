FROM active_replication/base
EXPOSE 10000
EXPOSE 10001
ENTRYPOINT node to_sequencer.js 10000 10001
