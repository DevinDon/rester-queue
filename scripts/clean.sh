#!/usr/bin/env bash
set -e

if [[ $@ =~ "--all" ]];
then
  cat .gitignore | sed "s/^\//.\//g" | xargs rm -rf
else
  rm -rf dist out temp logs
fi
