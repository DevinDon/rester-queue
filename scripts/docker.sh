#!/usr/bin/env bash

docker network create dev
docker rm -f dev-redis

docker run -d \
  --name dev-redis \
  -p 6379:6379 \
  -v dev-redis:/data \
  --network dev \
  redis:6.0.9 \
  redis-server --requirepass "dev-redis" --notify-keyspace-events "Ex"
