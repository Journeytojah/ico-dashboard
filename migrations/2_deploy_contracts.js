/* global web3:true */

const PixieToken = artifacts.require("PixieToken");
const PixieCrowdsale = artifacts.require("PixieCrowdsale");

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  deployer.deploy(PixieToken)
    .then(function () {

      const rate = 1;
      const wallet = accounts[0];
      const cap = ICO_SUPPLY * 0.9; // only sell 90%...for now

      return deployer.deploy(
        PixieCrowdsale,
        rate,
        wallet,
        PixieToken.address,
        cap
      )
    })
    .then(() => {
      return PixieToken.deployed()
        .then((contract) => contract.transfer(PixieCrowdsale.address, contract.initialSupply() / 2));
    });
};
