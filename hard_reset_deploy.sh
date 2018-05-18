#!/usr/bin/env bash

npm run clean; ./node_modules/.bin/truffle compile; ./node_modules/.bin/truffle migrate --network development
