const ether = require('../helpers/ether');
const assertRevert = require('../helpers/assertRevert');

const BigNumber = web3.BigNumber;

const should = require('chai')
.use(require('chai-as-promised'))
.use(require('chai-bignumber')(BigNumber))
.should();

const PixieCrowdsale = artifacts.require('PixieCrowdsale');
const PixieToken = artifacts.require('PixieToken');

contract('PixieCrowdsale', function ([_, investor, wallet, purchaser, authorized, unauthorized, anotherAuthorized]) {

  const rate = new BigNumber(1);

  let initialSupply;
  let amountAvailableForPurchase;

  let cap;
  let lessThanCap;

  const valueToPurchase = ether(0.0000000005);

  const expectedTokenAmount = rate.mul(valueToPurchase);

  beforeEach(async function () {
    this.token = await PixieToken.new();

    initialSupply = await this.token.initialSupply();
    amountAvailableForPurchase = initialSupply.times(0.5);
    cap = amountAvailableForPurchase.times(0.9);
    lessThanCap = amountAvailableForPurchase.times(0.6);

    this.crowdsale = await PixieCrowdsale.new(rate, wallet, this.token.address, cap);

    await this.token.transfer(this.crowdsale.address, amountAvailableForPurchase);

    // whitelist investor and purchaser otherwise they can invest in crowdsale
    await this.crowdsale.addToWhitelist(_);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(wallet);
    await this.crowdsale.addToWhitelist(purchaser);
    await this.crowdsale.addToWhitelist(authorized);
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

  // ** CAPPED crowdsale tests **

  describe('creating a valid crowdsale', function () {
    it('should fail with zero cap', async function () {
      await assertRevert(PixieCrowdsale.new(rate, wallet, 0, this.token.address));
    });
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {
      await this.crowdsale.send(cap.minus(lessThanCap), {from: investor}).should.be.fulfilled;
      await this.crowdsale.send(lessThanCap, {from: investor}).should.be.fulfilled;
    });

    it('should reject payments outside cap', async function () {
      await this.crowdsale.send(cap);
      await assertRevert(this.crowdsale.send(1));
    });

    it('should reject payments that exceed cap', async function () {
      await assertRevert(this.crowdsale.send(cap.plus(1)));
    });
  });

  describe('ending', function () {
    it('should not reach cap if sent under cap', async function () {
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
      await this.crowdsale.send(lessThanCap);
      capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should not reach cap if sent just under cap', async function () {
      await this.crowdsale.send(cap.minus(1));
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should reach cap if cap sent', async function () {
      await this.crowdsale.send(cap);
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(true);
    });
  });

  // ** WHITELIST crowdsale tests **

  describe('accepting payments', function () {
    it('should accept payments to whitelisted (from whichever buyers)', async function () {
      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: authorized}).should.be.fulfilled;
      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: unauthorized}).should.be.fulfilled;
    });

    it('should reject payments to not whitelisted (from whichever buyers)', async function () {
      // TODO FIX this is sent from an authorised address - how to set {from: unauthorized}?
      // await this.crowdsale.send(valueToPurchase).should.be.rejected;

      await this.crowdsale.buyTokens(unauthorized, {value: valueToPurchase, from: unauthorized}).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, {value: valueToPurchase, from: authorized}).should.be.rejected;
    });

    it('should reject payments to addresses removed from whitelist', async function () {
      await this.crowdsale.removeFromWhitelist(authorized);
      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: authorized}).should.be.rejected;
    });
  });

  describe('reporting whitelisted', function () {
    it('should correctly report whitelisted addresses', async function () {
      let isAuthorized = await this.crowdsale.whitelist(authorized);
      isAuthorized.should.equal(true);
      let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
      isntAuthorized.should.equal(false);
    });
  });

  describe('accepting payments', function () {
    it('should accept payments to whitelisted (from whichever buyers)', async function () {
      // ensure whitelisted
      await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);

      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: authorized}).should.be.fulfilled;
      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: unauthorized}).should.be.fulfilled;
      await this.crowdsale.buyTokens(anotherAuthorized, {value: valueToPurchase, from: authorized}).should.be.fulfilled;
      await this.crowdsale.buyTokens(anotherAuthorized, {value: valueToPurchase, from: unauthorized}).should.be.fulfilled;
    });

    it('should reject payments to not whitelisted (with whichever buyers)', async function () {
      // await this.crowdsale.send(value).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, {value: valueToPurchase, from: unauthorized}).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, {value: valueToPurchase, from: authorized}).should.be.rejected;
    });

    it('should reject payments to addresses removed from whitelist', async function () {
      await this.crowdsale.removeFromWhitelist(anotherAuthorized);
      await this.crowdsale.buyTokens(authorized, {value: valueToPurchase, from: authorized}).should.be.fulfilled;
      await this.crowdsale.buyTokens(anotherAuthorized, {value: valueToPurchase, from: authorized}).should.be.rejected;
    });
  });

  describe('reporting whitelisted', function () {
    it('should correctly report whitelisted addresses', async function () {
      // ensure whitelisted
      await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);

      let isAuthorized = await this.crowdsale.whitelist(authorized);
      isAuthorized.should.equal(true);
      let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
      isAnotherAuthorized.should.equal(true);
      let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
      isntAuthorized.should.equal(false);
    });
  });
});
