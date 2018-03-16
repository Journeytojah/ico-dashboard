const etherToWei = require('../helpers/etherToWei');
const weiToEther = require('../helpers/weiToEther');
const assertRevert = require('../helpers/assertRevert');

const advanceBlock = require('../helpers/advanceToBlock');
const increaseTimeTo = require('../helpers/increaseTime').increaseTimeTo;
const duration = require('../helpers/increaseTime').duration;
const latestTime = require('../helpers/latestTime');
const EVMRevert = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

const should = require('chai')
.use(require('chai-as-promised'))
.use(require('chai-bignumber')(BigNumber))
.should();

const PixieCrowdsale = artifacts.require('PixieCrowdsale');
const PixieToken = artifacts.require('PixieToken');

contract('PixieCrowdsale Tokenomics', function ([owner, investor, wallet]) {

  // 100 billion to 18 decimal places (so we multiply the whole token by 10 to the power 18)
  const pixieTotalTokenSupply = new BigNumber(100000000000).times(new BigNumber(10).pow(18));

  const pixieTokensAvailableInIco = pixieTotalTokenSupply.times(0.4); // 40% of total

  const pixieHardCapInWei = new BigNumber(etherToWei(65000)); // 65000 ETH
  const pixieSoftCapInWei = new BigNumber(etherToWei(17500)); // 17500 ETH

  const pixieTokenRatePerWei = pixieTokensAvailableInIco.dividedBy(pixieHardCapInWei).toFixed(0);

  const minContribution = new BigNumber(1);
  const maxContribution = pixieHardCapInWei;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();

    console.log(`Pixie total token supply: ${weiToEther(pixieTotalTokenSupply.toString(10))}`);

    console.log(`Pixie token for ICO sale: ${weiToEther(pixieTokensAvailableInIco.toString(10))}`);
    console.log(`Pixie soft cap in ETH: ${weiToEther(pixieSoftCapInWei.toString(10))}`);
    console.log(`Pixie hard cap in ETH: ${weiToEther(pixieHardCapInWei.toString(10))}`);

    console.log(`Pixie token rate per WEI: ${pixieTokenRatePerWei.toString(10)}`);
  });

  beforeEach(async function () {

    this.token = await PixieToken.new(pixieTotalTokenSupply);

    this.crowdsale = await PixieCrowdsale.new(
      pixieTokenRatePerWei,
      wallet,
      this.token.address,
      pixieHardCapInWei,
      (latestTime() + duration.seconds(10)),
      (latestTime() + duration.weeks(1)),
      minContribution,
      maxContribution,
      pixieSoftCapInWei,
      {from: owner}
    );

    await this.token.transfer(this.crowdsale.address, pixieTokensAvailableInIco);

    // approve so they can invest in crowdsale
    await this.crowdsale.addToWhitelist(owner);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(wallet);

    this.vault = await this.crowdsale.vault();
  });

  describe.only('Crowdsale should allow all tokens in ICO to be sold', function () {

    beforeEach(async function () {
      await increaseTimeTo(latestTime() + duration.seconds(11)); // force time to move on to 11 seconds

      let vaultBalance = web3.eth.getBalance(this.vault);
      let ownerBalance = await this.token.balanceOf(owner);
      let balance = await this.token.balanceOf(investor);
      let contractBalance = await this.token.balanceOf(this.crowdsale.address);

      console.log(
        `BEFORE > Vault: ${weiToEther(vaultBalance.toString(10))} ETHER, 
        Owner: ${weiToEther(ownerBalance.toString(10))} PIX, 
        Investor: ${weiToEther(balance.toString(10))} PIX, 
        Contract:${weiToEther(contractBalance.toString(10))} PIX`
      );
    });

    afterEach(async function () {
      let vaultBalance = web3.eth.getBalance(this.vault);
      let ownerBalance = await this.token.balanceOf(owner);
      let balance = await this.token.balanceOf(investor);
      let contractBalance = await this.token.balanceOf(this.crowdsale.address);


      console.log(
        `AFTER > Vault: ${weiToEther(vaultBalance.toString(10))} ETHER, 
        Owner: ${weiToEther(ownerBalance.toString(10))} PIX, 
        Investor: ${weiToEther(balance.toString(10))} PIX, 
        Contract:${weiToEther(contractBalance.toString(10))} PIX`
      );
    });

    describe('purchase all tokens', function () {
      it('should allocate all tokens to investor if they send the hard cap', async function () {

        let vaultBalance = web3.eth.getBalance(this.vault);
        vaultBalance.should.be.bignumber.equal(0);

        let investorBalance = await this.token.balanceOf(investor);
        investorBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, {value: pixieHardCapInWei, from: investor}).should.be.fulfilled;

        vaultBalance = web3.eth.getBalance(this.vault);
        vaultBalance.should.be.bignumber.equal(pixieHardCapInWei);

        investorBalance = await this.token.balanceOf(investor);

        // have more than 99.999% i.e. all of it!
        // because of the figure's it does not divide exactly and a bit of "dust" is left
        investorBalance.dividedBy(pixieTokensAvailableInIco).should.be.bignumber.greaterThan(0.99999);
      });

      it('should not allow more than the hard cap', async function () {
        let investorBalance = await this.token.balanceOf(investor);
        investorBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, {value: pixieHardCapInWei, from: investor}).should.be.fulfilled;

        investorBalance = await this.token.balanceOf(investor);

        // have more than 99.999% i.e. all of it!
        // because of the figure's it does not divide exactly and a bit of "dust" is left
        investorBalance.dividedBy(pixieTokensAvailableInIco).should.be.bignumber.greaterThan(0.99999);

        await assertRevert(this.crowdsale.buyTokens(investor, {value: 1, from: investor}));
      });
    });

    describe('purchase minimum amount of token', function () {
      it('should according to rate', async function () {

        let vaultBalance = web3.eth.getBalance(this.vault);
        vaultBalance.should.be.bignumber.equal(0);

        let investorBalance = await this.token.balanceOf(investor);
        investorBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, {value: minContribution, from: investor}).should.be.fulfilled;

        vaultBalance = web3.eth.getBalance(this.vault);
        vaultBalance.should.be.bignumber.equal(minContribution);

        investorBalance = await this.token.balanceOf(investor);
        investorBalance.should.be.bignumber.equal(minContribution * pixieTokenRatePerWei);
      });
    });
  });

});
