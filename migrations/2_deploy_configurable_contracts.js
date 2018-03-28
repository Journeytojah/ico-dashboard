/* global web3:true */
const Promise = require('bluebird');
const ConfigurableToken = artifacts.require('ConfigurableToken');
const ConfigurableCrowdsale = artifacts.require('ConfigurableCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = async function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  let promisifyGetBlockNumber = Promise.promisify(web3.eth.getBlockNumber);
  let promisifyGetBlock = Promise.promisify(web3.eth.getBlock);

  const BigNumber = web3.BigNumber;

  const _tokenInitialSupply = new BigNumber(1000);
  const _decimals = new BigNumber(0);

  // Deploy the token
  await deployer.deploy(ConfigurableToken, _tokenInitialSupply, _decimals);
  const deployedConfigurableToken = await ConfigurableToken.deployed();

  // Get last block
  let blockNumber = await promisifyGetBlockNumber();
  let block = await promisifyGetBlock(blockNumber);

  const _rate = 1;
  const _wallet = accounts[0];
  const _token = ConfigurableToken.address;
  const _cap = _tokenInitialSupply.times(0.5); // cap 50% of supply i.e 500 WEI

  const _openingTime = block.timestamp + 1; // one second in the future
  const _closingTime = _openingTime + (86400 * 20); // 20 days

  const _minContribution = 2;
  const _maxContribution = 250;

  const _goal = _tokenInitialSupply.times(0.25); // 25% of supply i.e 250 WEI
  const crowdsaleSupply = _tokenInitialSupply.times(0.5); // sell upto 50%, i.e. 500 WEI

  // Deploy the crowdsale with full configuration
  await deployer.deploy(ConfigurableCrowdsale, _rate, _wallet, _token, _cap, _openingTime, _closingTime, _minContribution, _maxContribution, _goal);

  // Transfer the ICO supply to the crowdsale
  await deployedConfigurableToken.transfer(ConfigurableCrowdsale.address, crowdsaleSupply);

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

  const deployedConfigurableCrowdsale = await ConfigurableCrowdsale.deployed();

  // Whitelist a few accounts fo ease
  await deployedConfigurableCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]);


  let privateSaleDetails = {
    closeTime: _openingTime + (86400 * 5),
    rate: _rate
  };

  let preSaleDetails = {
    closeTime: _openingTime + (86400 * 10), // 10 days,
    rate: _rate
  };

  // Update private and pre sale times and rates
  await deployedConfigurableCrowdsale.setPrivatePreSaleRates(privateSaleDetails.closeTime, privateSaleDetails.rate, preSaleDetails.closeTime, preSaleDetails.rate);
};
