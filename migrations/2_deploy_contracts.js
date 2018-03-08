/* global web3:true */

const PixieToken = artifacts.require('PixieToken');
const PixieCrowdsale = artifacts.require('PixieCrowdsale');

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  deployer.deploy(PixieToken)
    .then(() => PixieToken.deployed())
    .then((contract) => Promise.all([contract, contract.initialSupply()]))
    .then((results) => {

      const rate = 1;
      const wallet = accounts[0];
      const cap = results[1].times(0.5); // cap 50%...for now of total

      return Promise.all([
        deployer.deploy(
          PixieCrowdsale,
          rate,
          wallet,
          PixieToken.address,
          cap
        ),
        results[0],
        results[1]
      ]);
    })
    .then((results) => {
      const crowdsaleSupply = results[2].times(0.5); // sell upto 50%
      results[1].transfer(PixieCrowdsale.address, crowdsaleSupply);
    });
};
