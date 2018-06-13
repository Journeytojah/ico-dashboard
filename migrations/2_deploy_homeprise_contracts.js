var HomepriseCrowdsale = artifacts.require("./HomepriseCrowdsale.sol");
var HomepriseToken = artifacts.require("./HomepriseToken.sol");

module.exports = function(deployer) {
  const startTime = Math.round((new Date(Date.now()).getTime()) / 1000); // Yesterday
  const endTime = Math.round((new Date().getTime() + (86400000 * 20)) / 1000); // Today + 20 days

  return deployer
    .then(() => {
      return deployer.deploy(HomepriseToken);
    })
    .then(() => {
      return deployer.deploy(HomepriseCrowdsale, 
        startTime, 
        endTime,
        web3.eth.accounts[9], // Beneficiary address
        20000000000000000000, // Goal: 20 ETH
        500000000000000000000, // Cap: 500 ETH
        HomepriseToken.address
      );
    }).then(() => {
      tokenInstance = HomepriseToken.at(HomepriseToken.address);
      tokenInstance.transferOwnership(HomepriseCrowdsale.address);
    });
};