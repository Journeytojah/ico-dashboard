/* global web3:true */
const Promise = require('bluebird');
const ConfigurableToken = artifacts.require('ConfigurableToken');
const ConfigurableCrowdsale = artifacts.require('ConfigurableCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = function (deployer, network, accounts) {

  const BigNumber = web3.BigNumber;

  console.log(`Running within network = ${network}`);

  let promisifyGetBlockNumber = Promise.promisify(web3.eth.getBlockNumber);
  let promisifyGetBlock = Promise.promisify(web3.eth.getBlock);

  const _tokenInitialSupply = new BigNumber(1000);
  const _decimals = new BigNumber(0);

  deployer.deploy(ConfigurableToken, _tokenInitialSupply, _decimals)
  .then(() => promisifyGetBlockNumber().then((blockNumber) => promisifyGetBlock(blockNumber)))
  .then((block) => {

    const _rate = 1;
    const _wallet = accounts[0];
    const _token = ConfigurableToken.address;
    const _cap = _tokenInitialSupply.times(0.5); // cap 50% of supply i.e 500 WEI

    const _openingTime = block.timestamp + 1; // one second in the future
    const _closingTime = _openingTime + (86400 * 20); // 20 days

    const _privateSaleCloseTime = _openingTime + (86400 * 5); // 5 days
    const _privateSaleRate = _rate;

    const _preSaleCloseTime = _openingTime + (86400 * 10); // 10 days
    const _preSaleRate = _rate;

    const _minContribution = 2;
    const _maxContribution = 250;

    const _goal = _tokenInitialSupply.times(0.25); // 25% of supply i.e 250 WEI

    return Promise.all([
      deployer.deploy(
        ConfigurableCrowdsale,
        _rate,
        _wallet,
        _token,
        _cap,
        _openingTime,
        _closingTime,
        _minContribution,
        _maxContribution,
        _goal
      ),
      {
        closeTime: _privateSaleCloseTime,
        rate: _privateSaleRate
      },
      {
        closeTime: _preSaleCloseTime,
        rate: _preSaleRate
      },
      ConfigurableToken.deployed()
    ]);
  })
  .then((results) => {
    const crowdsaleSupply = _tokenInitialSupply.times(0.5); // sell upto 50%, i.e. 500 WEI

    const privateSaleDetails = results[1];
    const preSaleDetails = results[2];
    const deployedConfigurableToken = results[3];

    return Promise.all([
      ConfigurableCrowdsale.deployed(),
      deployedConfigurableToken.transfer(ConfigurableCrowdsale.address, crowdsaleSupply),
      privateSaleDetails,
      preSaleDetails
    ]);
  })
  .then((results) => {
    const deployedConfigurableCrowdsale = results[0];
    const privateSaleDetails = results[2];
    const preSaleDetails = results[3];

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

    return Promise.all([
      deployedConfigurableCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]),
      deployedConfigurableCrowdsale.setPrivatePreSaleRates(privateSaleDetails.closeTime, privateSaleDetails.rate, preSaleDetails.closeTime, preSaleDetails.rate)
    ]);
  });
};
