#!/usr/bin/env bash
set -e

if [ "$MODE" = "DEV" ];
then
  webpack --config scripts/webpack.dev.js --stats-error-details $@
else
  webpack --config scripts/webpack.prod.js --stats-error-details $@
fi
