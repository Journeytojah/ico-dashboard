/* global web3:true */

const PixieToken = artifacts.require("PixieToken");
const PixieCrowdsale = artifacts.require("PixieCrowdsale");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(PixieToken)
    .then(function () {

      const rate = 1;
      const wallet = accounts[0];

      return deployer.deploy(
        ABCTokenCrowdsale,
        rate,
        wallet,
        ABCToken.address
      )
    });
};
