/* global web3:true */
const Promise = require('bluebird');
const PixieToken = artifacts.require('PixieToken');
const PixieCrowdsale = artifacts.require('PixieCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = async function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  await deployer.deploy(PixieToken);
  await deployer.deploy(PixieCrowdsale, accounts[0], PixieToken.address);

  const deployedPixieToken = await PixieToken.deployed();
  const deployedPixieCrowdsale = await PixieCrowdsale.deployed();

  const _tokenInitialSupply = await deployedPixieToken.initialSupply();
  const crowdsaleSupply = _tokenInitialSupply.times(0.5); // sell upto 50%, i.e. 500 WEI

  await deployedPixieToken.transfer(PixieCrowdsale.address, crowdsaleSupply);

  let _contractCreatorAccount;
  let _secondTestApprovedTestAccount;

  // Load in other accounts for different networks
  if (network === 'ropsten' || network === 'rinkeby') {
    _secondTestApprovedTestAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 1).getAddress();
    _contractCreatorAccount = accounts[0];
  } else {
    _contractCreatorAccount = accounts[0];
    _secondTestApprovedTestAccount = accounts[1];
  }

  // console.log(`_contractCreatorAccount - [${_contractCreatorAccount}]`);
  // console.log(`_secondTestApprovedTestAccount - [${_secondTestApprovedTestAccount}]`);

  // Whitelist various utility accounts
  await deployedPixieCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]);

  // Whitelist the crowdsale
  await deployedPixieToken.addAddressToWhitelist(PixieCrowdsale.address, {from: accounts[0]});
};
