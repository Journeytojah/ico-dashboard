#!/usr/bin/env bash

node ./node_modules/.bin/truffle-flattener ./contracts/pixie/PixieCrowdsale.sol > ./contracts-flat/FLAT-PixieCrowdsale.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/pixie/PixieToken.sol > ./contracts-flat/FLAT-PixieToken.sol;
