const ether = require('../helpers/ether');
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

contract('PixieCrowdsale', function ([owner, investor, wallet, purchaser]) {

  const rate = new BigNumber(1);

  let initialSupply;
  let amountAvailableForPurchase;

  let cap;
  let lessThanCap;

  const valueToPurchase = ether(0.0000000005);

  const expectedTokenAmount = rate.mul(valueToPurchase);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await PixieToken.new();

    initialSupply = await this.token.initialSupply();
    amountAvailableForPurchase = initialSupply.times(0.5);
    cap = amountAvailableForPurchase.times(0.9);
    lessThanCap = amountAvailableForPurchase.times(0.6);

    this.openingTime = latestTime() + duration.seconds(1); // opens in 1 second
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.crowdsale = await PixieCrowdsale.new(rate, wallet, this.token.address, cap, this.openingTime, this.closingTime, {from: owner});

    await this.token.transfer(this.crowdsale.address, amountAvailableForPurchase);
    await increaseTimeTo(latestTime() + duration.seconds(2)); // force time to move on to 2 seconds - after opening time
  });

  after(async function () {
    console.log("Crowdsale Owner", await this.crowdsale.owner());
    console.log("test owner", owner);
    console.log("test investor", investor);
    console.log("test wallet", wallet);
    console.log("test purchaser", purchaser);
    console.log("getNow", await this.crowdsale.getNow());
    console.log("isBeforeCloseTime", await this.crowdsale.isBeforeCloseTime());
    console.log("hasClosed", await this.crowdsale.hasClosed());
    console.log("isCrowdsaleOpen", await this.crowdsale.isCrowdsaleOpen());
    console.log("isFinalized", await this.crowdsale.isFinalized());
    console.log("capReached", await this.crowdsale.capReached());
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
      await assertRevert(PixieCrowdsale.new(rate, wallet, 0, this.token.address, this.openingTime, this.closingTime, {from: owner}));
    });
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {
      await this.crowdsale.send(cap.minus(lessThanCap)).should.be.fulfilled;
      await this.crowdsale.send(lessThanCap).should.be.fulfilled;
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

  // ** FinalizableCrowdsale crowdsale tests **

  describe('FinalizableCrowdsale with timed open/close', function () {

    it('cannot be finalized before ending', async function () {
      await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMRevert);
    });

    it('cannot be finalized by third party after ending', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('can be finalized by owner after ending', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
    });

    it('cannot be finalized twice', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner});
      await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMRevert);
    });

    it('logs finalized', async function () {
      await increaseTimeTo(this.afterClosingTime);
      const {logs} = await this.crowdsale.finalize({from: owner});
      const event = logs.find(e => e.event === 'Finalized');
      should.exist(event);
    });

    describe('creating a valid finalizable', function () {
      it('should fail with zero opening time', async function () {
        await assertRevert(PixieCrowdsale.new(rate, wallet, cap, this.token.address, 0, this.closingTime, {from: owner}));
      });
      it('should fail with zero closing time', async function () {
        await assertRevert(PixieCrowdsale.new(rate, wallet, cap, this.token.address, this.openingTime, 0, {from: owner}));
      });
    });

  });

});
