#!/usr/bin/env bash
set -e

if [ $MODE == "PROD" ];
then
  npm run build && cd dist && node bundle.js
else
  node -r ts-node/register src/main.ts
fi
