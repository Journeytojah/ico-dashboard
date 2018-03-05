const IcoToken = artifacts.require("IcoToken");


module.exports = function (deployer, network, accounts) {
  deployer.deploy(IcoToken)
};
