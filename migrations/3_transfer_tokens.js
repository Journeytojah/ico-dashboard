/* global web3:true */
const Promise = require('bluebird');
const ConfigurableToken = artifacts.require('ConfigurableToken');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = async function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  // get the token
  const deployedConfigurableToken = await ConfigurableToken.deployed();

  let _contractCreatorAccount = accounts[0];
  let _coinfest = accounts[1];

  // Load in other accounts for different networks
  if (network === 'ropsten' || network === 'rinkeby') {
    _contractCreatorAccount = accounts[0].getAddress();
    _coinfest = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 1).getAddress();
  } else {
    _contractCreatorAccount = accounts[0];
    _coinfest = accounts[1];
  }

  console.log(`_contractCreatorAccount - [${_contractCreatorAccount}]`);
  console.log(`_coinfest - [${_coinfest}]`);

  // Transfer the ICO supply to the crowdsale
  await deployedConfigurableToken.transfer(_coinfest, 123);
};
