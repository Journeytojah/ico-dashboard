/* global web3:true */
const PixieToken = artifacts.require('PixieToken');
const PixieCrowdsale = artifacts.require('PixieCrowdsale');

module.exports = function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  deployer.deploy(PixieToken, 1000)
    .then(() => PixieToken.deployed())
    .then((contract) => Promise.all([contract, contract.initialSupply()]))
    .then((results) => {

      const _rate = 1;
      const _initialSupply = results[1];
      const _wallet = accounts[0];
      const _token = PixieToken.address;
      const _cap = _initialSupply.times(0.5); // cap 50% of supply i.e 500 WEI

      const _openingTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1; // one second in the future
      const _closingTime = _openingTime + (86400 * 20); // 20 days

      const _minContribution = 2;
      const _maxContribution = 10;

      const _goal = _initialSupply.times(0.25); // 25% of supply i.e 250 WEI

      const PixieTokenContract = results[0];

      return Promise.all([
        deployer.deploy(
          PixieCrowdsale,
          _rate,
          _wallet,
          _token,
          _cap,
          _openingTime,
          _closingTime,
          _minContribution,
          _maxContribution,
          _goal
        ),
        PixieTokenContract,
        _initialSupply
      ]);
    })
    .then((results) => {
      const crowdsaleSupply = results[2].times(0.5); // sell upto 50%, i.e. 500 WEI
      results[1].transfer(PixieCrowdsale.address, crowdsaleSupply);

      return PixieCrowdsale.deployed();
    })
    .then((contract) => contract.addManyToWhitelist([accounts[0], accounts[1]]));
};
