/* global web3:true */
const Web3 = require('web3');

const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';
let web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${infuraApikey}`));

const utils = require('./deployment_utils');

const PixieTokenAbi = require('../build/contracts/PixieToken.json');
const PixieCrowdsaleAbi = require('../build/contracts/PixieCrowdsale.json');

Promise.all([
  utils.estimateGas(web3, PixieTokenAbi.bytecode),
  utils.estimateGas(web3, PixieCrowdsaleAbi.bytecode),
  utils.getGasLimit(web3)
])
  .then((results) => {
    let pixieTokenGas = results[0];
    let pixieCrowdsaleGas = results[1];
    let gasLimit = results[2];

    console.log("pixieTokenGas", pixieTokenGas);
    console.log("pixieCrowdsaleGas", pixieCrowdsaleGas);

    console.log("gas limit", gasLimit);
    console.log("gas estimate token", Math.min(pixieTokenGas, gasLimit));
    console.log("gas estimate crowdsale", Math.min(pixieCrowdsaleGas, gasLimit));

  }).catch((error) => console.log(error));
