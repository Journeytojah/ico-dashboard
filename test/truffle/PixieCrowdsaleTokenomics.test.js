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

  const oneToThePowerEighteen = new BigNumber(1000000000000000000);

  const pixieTotalTokenSupply = new BigNumber(100000000000).times(oneToThePowerEighteen); // 100 billion to 18 decimal places
  const pixieTokenRatePerWei = new BigNumber(701754);
  const pixieTokensAvailableInIco = pixieTotalTokenSupply.times(0.4); // 40% of total
  const pixieHardCapInWei = new BigNumber(57000000000000000000000); // 57000 ETH
  const pixieSoftCapInWei = new BigNumber(20000000000000000000000); // 20000 ETH

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

    let printBalances = async function () {

    };

    beforeEach(async function () {
      await increaseTimeTo(latestTime() + duration.seconds(11)); // force time to move on to 11 seconds

      let vaultBalance = web3.eth.getBalance(this.vault);
      console.log(`Vault balance ${weiToEther(vaultBalance.toString(10))} ETHER`);

      let ownerBalance = await this.token.balanceOf(owner);
      console.log(`Owner balance ${weiToEther(ownerBalance.toString(10))} PIX`);

      let balance = await this.token.balanceOf(investor);
      console.log(`Token balance ${weiToEther(balance.toString(10))} PIX`);

      let contractBalance = await this.token.balanceOf(this.crowdsale.address);
      console.log(`Contract Token balance ${weiToEther(contractBalance.toString(10))} PIX`);
    });

    afterEach(async function () {
      let vaultBalance = web3.eth.getBalance(this.vault);
      console.log(`Vault balance ${weiToEther(vaultBalance.toString(10))} ETHER`);

      let ownerBalance = await this.token.balanceOf(owner);
      console.log(`Owner balance ${weiToEther(ownerBalance.toString(10))} PIX`);

      let balance = await this.token.balanceOf(investor);
      console.log(`Token balance ${weiToEther(balance.toString(10))} PIX`);

      let contractBalance = await this.token.balanceOf(this.crowdsale.address);
      console.log(`Contract Token balance ${weiToEther(contractBalance.toString(10))} PIX`);
    });

    describe('purchase all tokens', function () {
      it('should allocate all tokens to investor if they send the hard cap', async function () {
        await this.crowdsale.buyTokens(investor, {value: pixieHardCapInWei, from: investor}).should.be.fulfilled;
      });

      it('should not allow more than the hard cap', async function () {
        await this.crowdsale.buyTokens(investor, {value: pixieHardCapInWei, from: investor}).should.be.fulfilled;

        await assertRevert(this.crowdsale.buyTokens(investor, {value: 1, from: investor}));
      });
    });
  });

});
