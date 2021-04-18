#!/usr/bin/env bash
set -e

MODE=DEV node -r ts-node/register $@ src/main.ts
