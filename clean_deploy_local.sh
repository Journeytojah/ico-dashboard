#!/usr/bin/env bash

./node_modules/.bin/truffle compile --all; ./node_modules/.bin/truffle migrate --reset --all --network ganache
