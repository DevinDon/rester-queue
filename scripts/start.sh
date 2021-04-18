#!/usr/bin/env bash
set -e

demo=$1

if [ $MODE == "PROD" ];
then
  npm run build && cd dist && node bundle.js
else
  node -r ts-node/register demo/$demo.ts
fi
