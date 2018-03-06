/* global web3:true */

const ABCToken = artifacts.require("ABCToken");
const ABCTokenCrowdsale = artifacts.require("ABCTokenCrowdsale");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(ABCToken).then(function () {

    const opening = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;// one second in the future
    const closing = opening + (86400 * 20); // 20 days
    const rate = 2000000000000000;
    const cap = web3.toWei(50000, 'ether');
    const goal = web3.toWei(20000, 'ether');
    const wallet = accounts[0];

    return deployer.deploy(
      ABCTokenCrowdsale,
      opening,
      closing,
      rate,
      wallet,
      cap,
      ABCToken.address,
      goal
    )
  });
};
