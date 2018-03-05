/* global web3:true */

const IcoToken = artifacts.require("IcoToken");
const IcoTokenCrowdsale = artifacts.require("IcoTokenCrowdsale");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(IcoToken).then(function () {

    const opening = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;// one second in the future
    const closing = opening + (86400 * 20); // 20 days
    const rate = web3.toWei(0.1, 'ether');
    const cap = web3.toWei(1000000, 'ether');
    const goal = web3.toWei(33333, 'ether');
    const wallet = accounts[0];

    return deployer.deploy(
      IcoTokenCrowdsale,
      opening,
      closing,
      rate,
      wallet,
      cap,
      IcoToken.address,
      goal
    )
  });
};
