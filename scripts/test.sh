#!/usr/bin/env bash
set -e

echo "💡 You should start your server first."
echo "🧨 Test will start in 3 seconds."
sleep 3

jasmine \
  --config=jasmine.json \
  --reporter=jasmine-console-reporter \
  --require=ts-node/register
