#!/usr/bin/env bash

if [ "$1" = "up" ]; then
  docker-compose -f scripts/redis-cluster/docker-compose.yaml up $2
else
  docker-compose -f scripts/redis-cluster/docker-compose.yaml down
  docker ps -a | grep rester-redis- | awk '{ print $1 }' | xargs docker rm -f
  docker volume ls | grep redis-cluster | awk '{ print $2 }' | xargs docker volume rm
fi
