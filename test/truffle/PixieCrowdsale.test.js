const ether = require('../helpers/ether');
const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PixieCrowdsale = artifacts.require('PixieCrowdsale');
const PixieToken = artifacts.require('PixieToken');

contract('PixieCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);

  let initialSupply;
  let amountAvailableForPurchase;

  const valueToPurchase = ether(0.0000000005);

  const expectedTokenAmount = rate.mul(valueToPurchase);

  beforeEach(async function () {
    this.token = await PixieToken.new();
    this.crowdsale = await PixieCrowdsale.new(rate, wallet, this.token.address);

    initialSupply = await this.token.initialSupply();
    amountAvailableForPurchase = initialSupply / 2;

    await this.token.transfer(this.crowdsale.address, amountAvailableForPurchase);
  });


  describe('accepting payments', function () {
    it('should accept payments', async function () {
      await this.crowdsale.send(valueToPurchase).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, {value: valueToPurchase, from: purchaser}).should.be.fulfilled;
    });
  });

  describe('high-level purchase', function () {
    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.sendTransaction({value: valueToPurchase, from: investor});
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(valueToPurchase);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({value: valueToPurchase, from: investor});
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({value: valueToPurchase, from: investor});
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(valueToPurchase);
    });
  });

  describe('low-level purchase', function () {
    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.buyTokens(investor, {value: valueToPurchase, from: purchaser});
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(valueToPurchase);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, {value: valueToPurchase, from: purchaser});
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, {value: valueToPurchase, from: purchaser});
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(valueToPurchase);
    });
  });
});
