/* global web3:true */

const PixieToken = artifacts.require("PixieToken");
const PixieCrowdsale = artifacts.require("PixieCrowdsale");

const INITIAL_SUPPLY = 10000000000;
const ICO_SUPPLY = INITIAL_SUPPLY / 2;

module.exports = function (deployer, network, accounts) {
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
      return PixieToken.deployed().then((contract) => contract.transfer(PixieCrowdsale.address, ICO_SUPPLY));
    });
};
