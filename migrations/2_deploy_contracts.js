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

      const _privateSaleCloseTime = _openingTime + (86400 * 5); // 5 days
      const _preSaleCloseTime = _openingTime + (86400 * 10); // 10 days

      const _minContribution = 2;
      const _maxContribution = 250;

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
        _initialSupply,
        _privateSaleCloseTime,
        _preSaleCloseTime
      ]);
    })
    .then((results) => {
      let initialSupply = results[2];
      const crowdsaleSupply = initialSupply.times(0.5); // sell upto 50%, i.e. 500 WEI

      let pixieToken = results[1];
      pixieToken.transfer(PixieCrowdsale.address, crowdsaleSupply);

      let _privateSaleCloseTime = results[3];
      let _preSaleCloseTime = results[4];

      return Promise.all([
        PixieCrowdsale.deployed(),
        _privateSaleCloseTime,
        _preSaleCloseTime
      ])
    })
    .then((results) => {
      let contract = results[0];
      let _privateSaleCloseTime = results[1];
      let _preSaleCloseTime = results[2];

      return Promise.all([
        contract.addManyToWhitelist([accounts[0], accounts[1]]),
        contract.setPrivateSaleCloseTime(_privateSaleCloseTime),
        contract.setPreSaleCloseTime(_preSaleCloseTime)
      ])
    });
};
