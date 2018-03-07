/* global web3:true */

const PixieToken = artifacts.require("PixieToken");
const PixieCrowdsale = artifacts.require("PixieCrowdsale");

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  deployer.deploy(PixieToken)
    .then(function () {

      const rate = 1;
      const wallet = accounts[0];

      return deployer.deploy(
        PixieCrowdsale,
        rate,
        wallet,
        PixieToken.address
      )
    })
    .then(() => {
      return PixieToken.deployed()
        .then((contract) => contract.transfer(PixieCrowdsale.address, contract.initialSupply() / 2));
    });
};
