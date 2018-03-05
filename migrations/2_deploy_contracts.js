const IcoToken = artifacts.require("IcoToken");
const IcoTokenCrowdsale = artifacts.require("IcoTokenCrowdsale");

const BigNumber = web3.BigNumber;

module.exports = function (deployer, network, accounts) {
  deployer.deploy(IcoToken).then(function() {
    return deployer.deploy(IcoTokenCrowdsale, new BigNumber(1), accounts[0], IcoToken.address, new BigNumber(1000))
  });
};
