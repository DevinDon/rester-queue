#!/usr/bin/env bash
set -e

if [ ! -n "$1" ];
then
  echo "Error: Image name cannot be empty"
  exit 1
else
  image=$1
fi

cp scripts/Dockerfile dist/Dockerfile
cd dist
docker build -t $image .
docker push $image
