/* global web3:true */
const Promise = require('bluebird');
const PixieToken = artifacts.require('PixieToken');
const PixieCrowdsale = artifacts.require('PixieCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  deployer.deploy(PixieToken, {from: accounts[0]})
  .then(() => PixieToken.deployed())
  .then((deployedPixieToken) => deployedPixieToken.initialSupply())
  .then((initialSupply) => {

    return Promise.all([
      deployer.deploy(PixieCrowdsale, accounts[0], PixieToken.address, {from: accounts[0]}),
      PixieToken.deployed(),
      initialSupply
    ]);
  })
  .then((results) => {
    const deployedPixieToken = results[1];
    const _tokenInitialSupply = results[2];
    const crowdsaleSupply = _tokenInitialSupply.times(0.5); // sell upto 50%, i.e. 500 WEI

    return Promise.all([
      PixieCrowdsale.deployed(),
      PixieToken.deployed(),
      deployedPixieToken.transfer(PixieCrowdsale.address, crowdsaleSupply, {from: accounts[0]})
    ]);
  })
  .then((results) => {
    const deployedPixieCrowdsale = results[0];
    const deployedPixieToken = results[1];

    let _contractCreatorAccount;
    let _secondTestApprovedTestAccount;

    // Load in other accounts for different networks
    if (network === 'ropsten' || network === 'rinkeby') {
      _secondTestApprovedTestAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 1).getAddress();
      _contractCreatorAccount = accounts[0].getAddress();
    } else {
      _contractCreatorAccount = accounts[0];
      _secondTestApprovedTestAccount = accounts[1];
    }

    // console.log(`_contractCreatorAccount - [${_contractCreatorAccount}]`);
    // console.log(`_secondTestApprovedTestAccount - [${_secondTestApprovedTestAccount}]`);

    // whitelist approved account in crowdsale
    // whitelist crowdsale in token so it can transfer token during the sale
    return Promise.all([
      deployedPixieCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]),
      // deployedPixieToken.addAddressToWhitelist(PixieCrowdsale.address, {from: accounts[0]})
    ]);
  });
};
