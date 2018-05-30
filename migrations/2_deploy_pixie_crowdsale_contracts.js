/* global web3:true */
const Promise = require('bluebird');
const PixieToken = artifacts.require('PixieToken');
const PixieCrowdsale = artifacts.require('PixieCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  let _contractCreatorAccount;
  let _secondTestApprovedTestAccount;

  // Load in other accounts for different networks
  if (network === 'ropsten' || network === 'rinkeby') {
    _contractCreatorAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 0).getAddress();
    _secondTestApprovedTestAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 1).getAddress();
  } else {
    _contractCreatorAccount = accounts[0];
    _secondTestApprovedTestAccount = accounts[1];
  }

  console.log(`_contractCreatorAccount - [${_contractCreatorAccount}]`);
  console.log(`_secondTestApprovedTestAccount - [${_secondTestApprovedTestAccount}]`);

  return deployer.deploy(PixieToken)
    .then((deployedPixieToken) => {
      return deployer.deploy(PixieCrowdsale, _contractCreatorAccount, PixieToken.address)
        .then((deployedPixieCrowdsale) => {
          return {
            deployedPixieToken,
            deployedPixieCrowdsale
          }
        })
    })
    .then(({deployedPixieToken, deployedPixieCrowdsale}) => {

      let promise1 = deployedPixieToken.initialSupply()
        .then((_tokenInitialSupply) => {
          const crowdsaleSupply = _tokenInitialSupply.times(0.4); // sell upto 40%
          return deployedPixieToken.transfer(PixieCrowdsale.address, crowdsaleSupply);
        });

      // Whitelist various utility accounts
      let promise2 = deployedPixieCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]);

      // Whitelist the crowdsale
      let promise3 = deployedPixieToken.addAddressToWhitelist(PixieCrowdsale.address, {from: _contractCreatorAccount});

      // add curator and another account to management
      let promise4 = deployedPixieCrowdsale.addManyToManagementWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]);

      return Promise.all([promise1, promise2, promise3, promise4]);
    });
};
