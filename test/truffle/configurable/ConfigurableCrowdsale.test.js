const etherToWei = require('../../helpers/etherToWei');
const assertRevert = require('../../helpers/assertRevert');

const advanceBlock = require('../../helpers/advanceToBlock');
const increaseTimeTo = require('../../helpers/increaseTime').increaseTimeTo;
const duration = require('../../helpers/increaseTime').duration;
const latestTime = require('../../helpers/latestTime');
const EVMRevert = require('../../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ConfigurableCrowdsale = artifacts.require('ConfigurableCrowdsale');
const ConfigurableToken = artifacts.require('ConfigurableToken');

contract('ConfigurableCrowdsale', function ([owner, investor, wallet, purchaser, authorized, unauthorized, anotherAuthorized]) {

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await ConfigurableToken.new(1000, 0);

    this.rate = new BigNumber(1);

    this.initialSupply = await this.token.initialSupply(); // 1000 WEI
    this.amountAvailableForPurchase = this.initialSupply.times(0.5); // 500 WEI
    this.cap = this.amountAvailableForPurchase; // 500 WEI

    this.openingTime = latestTime() + duration.seconds(10); // opens in 10 seconds
    this.closingTime = this.openingTime + duration.weeks(1); // closes in 1 week & 1 second
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.privateSaleCloseTime = this.openingTime + duration.days(1); // private sale to close 1 day after opening
    this.privateSaleRate = new BigNumber(3);

    this.preSaleCloseTime = this.openingTime + duration.days(3); // pre sale to close 3 days after opening
    this.preSaleRate = new BigNumber(2);

    this.minContribution = new BigNumber(5); // 5 WEI
    this.maxContribution = new BigNumber(this.cap).times(0.5); // 250 WEI

    this.goal = new BigNumber(250);

    this.value = this.minContribution;
    this.standardExpectedTokenAmount = this.rate.mul(this.value);

    this.crowdsale = await ConfigurableCrowdsale.new(
      this.rate,
      wallet,
      this.token.address,
      this.cap,
      this.openingTime,
      this.closingTime,
      this.minContribution,
      this.maxContribution,
      this.goal,
      {from: owner}
    );

    // setup default rates
    await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, this.preSaleCloseTime, this.preSaleRate);

    // ensure tokens can be transferred from crowdsale
    await this.token.transfer(this.crowdsale.address, this.amountAvailableForPurchase);

    // approve so they can invest in crowdsale
    await this.crowdsale.addToWhitelist(owner);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(wallet);
    await this.crowdsale.addToWhitelist(purchaser);

    // used in whitelist testing
    await this.crowdsale.addToWhitelist(authorized);

    this.vault = await this.crowdsale.vault();
  });

  after(async function () {
    console.log('Crowdsale Owner', await this.crowdsale.owner());
    console.log('test owner', owner);
    console.log('test investor', investor);
    console.log('test wallet', wallet);
    console.log('test purchaser', purchaser);
    console.log('getNow', await this.crowdsale.getNow());
    console.log('hasClosed', await this.crowdsale.hasClosed());
    console.log('isCrowdsaleOpen', await this.crowdsale.isCrowdsaleOpen());
    console.log('isFinalized', await this.crowdsale.isFinalized());
    console.log('capReached', await this.crowdsale.capReached());
    console.log('cap', await this.crowdsale.cap());
    console.log('min contribution', await this.crowdsale.min());
    console.log('max contribution', await this.crowdsale.max());
    console.log('goal', await this.crowdsale.goal());
    console.log('paused', await this.crowdsale.paused());
    console.log('openingTime', await this.crowdsale.openingTime());
    console.log('closingTime', await this.crowdsale.closingTime());
    console.log('privateSaleCloseTime', await this.crowdsale.privateSaleCloseTime());
    console.log('privateSaleRate', await this.crowdsale.privateSaleRate());
    console.log('preSaleCloseTime', await this.crowdsale.preSaleCloseTime());
    console.log('preSaleRate', await this.crowdsale.preSaleRate());
  });

  describe.only('Crowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

    describe('accepting payments', function () {
      it('should accept payments', async function () {
        await this.crowdsale.send(this.value).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, {value: this.value, from: purchaser}).should.be.fulfilled;
      });
    });

    describe('high-level purchase', function () {
      it('should log purchase', async function () {
        const {logs} = await this.crowdsale.sendTransaction({value: this.value, from: investor});
        const event = logs.find(e => e.event === 'TokenPurchase');
        should.exist(event);
        event.args.purchaser.should.equal(investor);
        event.args.beneficiary.should.equal(investor);
        event.args.value.should.be.bignumber.equal(this.value);
        event.args.amount.should.be.bignumber.equal(this.standardExpectedTokenAmount);
      });

      it('should assign tokens to sender', async function () {
        await this.crowdsale.sendTransaction({value: this.value, from: investor});
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(this.standardExpectedTokenAmount);
      });

      // when using RefundableCrowdsale the "vault" holds the funds
      it('should forward funds to vault', async function () {
        const pre = web3.eth.getBalance(this.vault);
        await this.crowdsale.sendTransaction({value: this.value, from: investor});

        const post = web3.eth.getBalance(this.vault);
        post.minus(pre).should.be.bignumber.equal(this.value);
      });
    });

    describe('low-level purchase', function () {
      it('should log purchase', async function () {
        const {logs} = await this.crowdsale.buyTokens(investor, {value: this.value, from: purchaser});
        const event = logs.find(e => e.event === 'TokenPurchase');
        should.exist(event);
        event.args.purchaser.should.equal(purchaser);
        event.args.beneficiary.should.equal(investor);
        event.args.value.should.be.bignumber.equal(this.value);
        event.args.amount.should.be.bignumber.equal(this.standardExpectedTokenAmount);
      });

      it('should assign tokens to beneficiary', async function () {
        await this.crowdsale.buyTokens(investor, {value: this.value, from: purchaser});
        const balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(this.standardExpectedTokenAmount);
      });

      // when using RefundableCrowdsale the "vault" holds the funds
      it('should forward funds to vault', async function () {
        const pre = web3.eth.getBalance(this.vault);
        await this.crowdsale.buyTokens(investor, {value: this.value, from: purchaser});

        const post = web3.eth.getBalance(this.vault);
        post.minus(pre).should.be.bignumber.equal(this.value);
      });
    });
  });

  describe('CappedCrowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

    describe('creating a valid crowdsale', function () {
      it('should fail with zero cap', async function () {
        await assertRevert(
          ConfigurableCrowdsale.new(
            this.rate,
            wallet,
            0,
            this.token.address,
            this.openingTime,
            this.closingTime,
            this.minContribution,
            this.maxContribution,
            this.goal,
            {from: owner}
          )
        );
      });
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.send(this.maxContribution.minus(this.minContribution)).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {

        // cap is twice the max contribution so send that from multiple buyers
        await this.crowdsale.send(this.maxContribution);
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution, from: purchaser});

        await assertRevert(this.crowdsale.buyTokens(authorized, {value: 1, from: authorized}));
      });

      it('should reject payments that exceed cap', async function () {

        // cap is twice the max contribution so send that from multiple buyers
        await this.crowdsale.send(this.maxContribution);
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution, from: purchaser});

        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(true);

        await assertRevert(this.crowdsale.buyTokens(authorized, {value: 1, from: authorized}));
      });
    });

    describe('ending', function () {
      it('should not reach cap if sent under cap', async function () {
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
        await this.crowdsale.send(this.minContribution);
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });

      it('should not reach cap if sent just under cap', async function () {
        // cap is twice the max contribution so send that from multiple buyers
        await this.crowdsale.send(this.maxContribution);
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution.minus(1), from: purchaser});

        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });

      it('should reach cap if cap sent', async function () {
        // cap is twice the max contribution so send that from multiple buyers
        await this.crowdsale.send(this.maxContribution);
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution, from: purchaser});

        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(true);
      });
    });

  });

  describe('FinalizableCrowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

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

  });

  describe('TimedCrowdsale with timed open/close', function () {

    it('should be ended only after end', async function () {
      let ended = await this.crowdsale.hasClosed();
      ended.should.equal(false);
      await increaseTimeTo(this.afterClosingTime);
      ended = await this.crowdsale.hasClosed();
      ended.should.equal(true);
    });

    describe('accepting payments', function () {

      it('should reject payments before start', async function () {
        await this.crowdsale.send(this.value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, {
          from: purchaser,
          value: this.value
        }).should.be.rejectedWith(EVMRevert);
      });

      it('should accept payments after start', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.send(this.value).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, {value: this.value, from: purchaser}).should.be.fulfilled;
      });

      it('should reject payments after end', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.send(this.value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, {
          value: this.value,
          from: purchaser
        }).should.be.rejectedWith(EVMRevert);
      });

    });

    describe('creating a valid timed crowdsale contract', function () {
      it('should fail with zero opening time', async function () {
        await assertRevert(
          ConfigurableCrowdsale.new(
            this.rate,
            wallet,
            this.cap,
            this.token.address,
            0,
            this.closingTime,
            this.minContribution,
            this.maxContribution,
            this.goal,
            {from: owner}
          )
        );
      });
      it('should fail with zero closing time', async function () {
        await assertRevert(
          ConfigurableCrowdsale.new(
            this.rate,
            wallet,
            this.cap,
            this.token.address,
            this.openingTime,
            0,
            this.minContribution,
            this.maxContribution,
            this.goal,
            {from: owner})
        );
      });
    });

  });

  describe('Ownable', function () {

    it('should have an owner', async function () {
      let owner = await this.crowdsale.owner();
      assert.isTrue(owner !== 0);
    });

    it('changes owner after transfer', async function () {
      await this.crowdsale.transferOwnership(investor);
      let newOwner = await this.crowdsale.owner();

      assert.isTrue(newOwner === investor);
    });

    it('should prevent non-owners from transfering', async function () {
      const other = purchaser;
      const owner = await this.crowdsale.owner.call();
      assert.isTrue(owner !== other);
      await assertRevert(this.crowdsale.transferOwnership(other, {from: other}));
    });

    it('should guard ownership against stuck state', async function () {
      let originalOwner = await this.crowdsale.owner();
      await assertRevert(this.crowdsale.transferOwnership(null, {from: originalOwner}));
    });
  });

  describe('Whitelisting', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale

      // ensure whitelisted
      await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);
    });

    describe('accepting payments', function () {
      it('should accept payments to whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.buyTokens(authorized, {value: this.value, from: authorized}).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, {value: this.value, from: unauthorized}).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.send({value: this.value, from: unauthorized}).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, {value: this.value, from: unauthorized}).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, {value: this.value, from: authorized}).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.removeFromWhitelist(authorized);
        await this.crowdsale.buyTokens(authorized, {value: this.value, from: authorized}).should.be.rejected;
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

        await this.crowdsale.buyTokens(authorized, {value: this.value, from: authorized}).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, {value: this.value, from: unauthorized}).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this.value,
          from: authorized
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this.value,
          from: unauthorized
        }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (with whichever buyers)', async function () {

        await this.crowdsale.send({value: this.value, from: unauthorized}).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, {value: this.value, from: unauthorized}).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, {value: this.value, from: authorized}).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.removeFromWhitelist(anotherAuthorized);
        await this.crowdsale.buyTokens(authorized, {value: this.value, from: authorized}).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this.value,
          from: authorized
        }).should.be.rejected;
      });
    });

    describe('reporting whitelisted', function () {
      it('should correctly report whitelisted addresses', async function () {
        let isAuthorized = await this.crowdsale.whitelist(authorized);
        isAuthorized.should.equal(true);

        let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
        isAnotherAuthorized.should.equal(true);

        let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
        isntAuthorized.should.equal(false);
      });
    });
  });


  describe('Pausable', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

    it('should not allow transfer when paused', async function () {
      await this.crowdsale.pause();
      let contractPaused = await this.crowdsale.paused.call();
      contractPaused.should.equal(true);

      await assertRevert(this.crowdsale.buyTokens(authorized, {value: this.minContribution, from: authorized}));
      await this.crowdsale.unpause();

      contractPaused = await this.crowdsale.paused.call();
      contractPaused.should.equal(false)
    });

    it('should allow transfer when unpaused', async function () {
      await this.crowdsale.pause();
      await this.crowdsale.unpause();

      let contractPaused = await this.crowdsale.paused.call();
      contractPaused.should.equal(false);

      await this.crowdsale.buyTokens(authorized, {value: this.minContribution, from: authorized}).should.be.fulfilled;
    });

    it('should not allow send when paused', async function () {
      await this.crowdsale.pause();
      let contractPaused = await this.crowdsale.paused.call();
      contractPaused.should.equal(true);

      await assertRevert(this.crowdsale.send(this.minContribution));
    });

    describe('pause', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

        describe('when the token is unpaused', function () {
          it('pauses the token', async function () {
            await this.crowdsale.pause({ from });

            const paused = await this.crowdsale.paused();
            assert.equal(paused, true);
          });

          it('emits a paused event', async function () {
            const { logs } = await this.crowdsale.pause({ from });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Pause');
          });
        });

        describe('when the token is paused', function () {
          beforeEach(async function () {
            await this.crowdsale.pause({ from });
          });

          it('reverts', async function () {
            await assertRevert(this.crowdsale.pause({ from }));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAuthorized;

        it('reverts', async function () {
          await assertRevert(this.crowdsale.pause({ from }));
        });
      });
    });

    describe('unpause', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

        describe('when the token is paused', function () {
          beforeEach(async function () {
            await this.crowdsale.pause({ from });
          });

          it('unpauses the token', async function () {
            await this.crowdsale.unpause({ from });

            const paused = await this.crowdsale.paused();
            assert.equal(paused, false);
          });

          it('emits an unpaused event', async function () {
            const { logs } = await this.crowdsale.unpause({ from });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Unpause');
          });
        });

        describe('when the token is unpaused', function () {
          it('reverts', async function () {
            await assertRevert(this.crowdsale.unpause({ from }));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAuthorized;

        it('reverts', async function () {
          await assertRevert(this.crowdsale.unpause({ from }));
        });
      });
    });
  });

  describe('IndividualLimitsCrowdsale - min & max contributions', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

    describe('creating a valid crowdsale', function () {
      it('should fail with zero minimum', async function () {
        await assertRevert(
          ConfigurableCrowdsale.new(
            this.rate,
            wallet,
            this.cap,
            this.token.address,
            this.openingTime,
            this.closingTime,
            0,
            this.maxContribution,
            this.goal,
            {from: owner}
          )
        );
      });

      it('should fail with zero maximum', async function () {
        await assertRevert(
          ConfigurableCrowdsale.new(
            this.rate,
            wallet,
            this.cap,
            this.token.address,
            this.openingTime,
            this.closingTime,
            this.minContribution,
            0,
            this.goal,
            {from: owner}
          )
        );
      });
    });

    describe('sending minimum', function () {
      it('should fail if below limit', async function () {
        await assertRevert(this.crowdsale.send(1));
        await assertRevert(this.crowdsale.send(this.minContribution.minus(1)));
      });

      it('should allow if exactly min limit', async function () {
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, {value: this.minContribution, from: purchaser}).should.be.fulfilled;
      });

      it('should allow if over min limit but less than max limit', async function () {
        await this.crowdsale.send(this.maxContribution.minus(this.minContribution)).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, {
          value: this.maxContribution.minus(this.minContribution),
          from: purchaser
        }).should.be.fulfilled;
      });
    });

    describe('tracks contributions', function () {
      it('should report amount of wei contributed via default function', async function () {
        const preContribution = await this.crowdsale.contributions(owner);
        preContribution.should.be.bignumber.equal(0);

        await this.crowdsale.send(this.minContribution).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(owner);
        postContribution.should.be.bignumber.equal(this.minContribution);

        await this.crowdsale.send(this.minContribution).should.be.fulfilled;

        const secondPostContribution = await this.crowdsale.contributions(owner);
        secondPostContribution.should.be.bignumber.equal(this.minContribution.times(2));
      });

      it('should report amount of wei contributed via buyTokens', async function () {
        const preContribution = await this.crowdsale.contributions(purchaser);
        preContribution.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(purchaser, {value: this.minContribution, from: purchaser}).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(purchaser);
        postContribution.should.be.bignumber.equal(this.minContribution);

        await this.crowdsale.buyTokens(purchaser, {value: this.minContribution, from: purchaser}).should.be.fulfilled;

        const secondPostContribution = await this.crowdsale.contributions(purchaser);
        secondPostContribution.should.be.bignumber.equal(this.minContribution.times(2));
      });

      it('should allow multiple contributions if below max limit', async function () {

        // well below max limit
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(owner);
        postContribution.should.be.bignumber.equal(this.minContribution.times(5));
      });
    });

    describe('sending maximum', function () {
      it('should fail if above limit via default', async function () {
        await this.crowdsale.send(this.maxContribution).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(owner);
        postContribution.should.be.bignumber.equal(this.maxContribution);

        await assertRevert(this.crowdsale.send(1));
      });

      it('should fail if above limit via buyTokens', async function () {
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution, from: purchaser}).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(purchaser);
        postContribution.should.be.bignumber.equal(this.maxContribution);

        await assertRevert(this.crowdsale.buyTokens(purchaser, {value: 1, from: purchaser}));
      });
    });
  });

  describe('Refundable with goal', function () {

    describe('creating a valid crowdsale', function () {
      it('should fail with zero goal', async function () {
        await assertRevert(ConfigurableCrowdsale.new(
          this.rate,
          wallet,
          this.token.address,
          this.cap,
          this.openingTime,
          this.closingTime,
          this.minContribution,
          this.maxContribution,
          0,
          {from: owner}
        ));
      });
    });

    it('should deny refunds before end', async function () {
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('should deny refunds after end if goal was reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
      await this.crowdsale.sendTransaction({value: this.goal, from: investor});
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if goal was not reached', async function () {
      const lessThanGoal = this.goal.minus(1);

      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
      await this.crowdsale.sendTransaction({value: lessThanGoal, from: investor});

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner});

      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({from: investor, gasPrice: 0}).should.be.fulfilled;
      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(lessThanGoal);
    });

    it('should forward funds to wallet after end if goal was reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
      await this.crowdsale.sendTransaction({value: this.goal, from: investor});

      await increaseTimeTo(this.afterClosingTime);
      const pre = web3.eth.getBalance(wallet);

      await this.crowdsale.finalize({from: owner});
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(this.goal);
    });
  });

  describe('Private/Pre ICO date restrictions - setPrivatePreSaleRates()', function () {

    describe('enhanced _preValidatePurchase() checks', function () {

      beforeEach(async function () {
        this.crowdsale = await ConfigurableCrowdsale.new(
          this.rate,
          wallet,
          this.token.address,
          this.cap,
          this.openingTime,
          this.closingTime,
          this.minContribution,
          this.maxContribution,
          this.goal,
          {from: owner}
        );

        // ensure tokens can be transferred from crowdsale
        await this.token.transfer(this.crowdsale.address, this.amountAvailableForPurchase);

        // approve so they can invest in crowdsale
        await this.crowdsale.addToWhitelist(owner);
        await this.crowdsale.addToWhitelist(investor);

        // used in whitelist testing
        await this.crowdsale.addToWhitelist(authorized);

        await increaseTimeTo(this.openingTime + duration.seconds(1)); // set time to just after open time
      });

      it('should fail without private/pre sale rates', async function () {
        // Failed
        await this.crowdsale.sendTransaction({value: this.value, from: investor}).should.be.rejectedWith(EVMRevert);

        // Added rates
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, this.preSaleCloseTime, this.preSaleRate).should.be.fulfilled;

        // Success
        await this.crowdsale.sendTransaction({value: this.value, from: investor});
        let balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(this.standardExpectedTokenAmount * this.privateSaleRate);
      });

    });

    describe('private sale test validation', function () {
      it('should not allow private sale of zero', async function () {
        await this.crowdsale.setPrivatePreSaleRates(0, this.rate, this.preSaleCloseTime, this.preSaleRate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow private sale time before opening time', async function () {
        let invalidTime = this.openingTime - duration.seconds(1);
        await this.crowdsale.setPrivatePreSaleRates(invalidTime, this.rate, this.preSaleCloseTime, this.preSaleRate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow private sale time after closing time', async function () {
        let invalidTime = this.closingTime + duration.seconds(1);
        await this.crowdsale.setPrivatePreSaleRates(invalidTime, this.rate, this.preSaleCloseTime, this.preSaleRate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow private sale rate of 0', async function () {
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, 0, this.preSaleCloseTime, this.preSaleRate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow pre sale time set when not the owner', async function () {
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.rate, this.preSaleCloseTime, this.preSaleRate, {from: investor}).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('pre sale test validation', function () {
      it('should not allow pre sale time of zero', async function () {
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, 0, this.rate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow pre sale time before private sale time', async function () {
        let invalidTime = this.privateSaleCloseTime - duration.seconds(1);
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, invalidTime, this.rate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow pre sale time after closing time', async function () {
        let invalidTime = this.closingTime + duration.seconds(1);
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, invalidTime, this.rate).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow private sale rate of 0', async function () {
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, this.preSaleCloseTime, 0).should.be.rejectedWith(EVMRevert);
      });

      it('should not allow pre sale time set when not the owner', async function () {
        await this.crowdsale.setPrivatePreSaleRates(this.privateSaleCloseTime, this.privateSaleRate, this.preSaleCloseTime, this.rate, {from: investor}).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('overridden _getTokenAmount() method', function () {

      describe('private sale rate', async function () {

        beforeEach(async function () {
          await increaseTimeTo(this.privateSaleCloseTime - duration.seconds(10)); // set time to just before private sale close
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({value: this.value, from: investor});
          let balance = await this.token.balanceOf(investor);
          balance.should.be.bignumber.equal(this.standardExpectedTokenAmount * this.privateSaleRate);
        });

        // when using RefundableCrowdsale the "vault" holds the funds
        it('should forward funds to vault', async function () {
          const pre = web3.eth.getBalance(this.vault);
          await this.crowdsale.sendTransaction({value: this.value, from: investor});

          const post = web3.eth.getBalance(this.vault);
          post.minus(pre).should.be.bignumber.equal(this.value);
        });
      });

      describe('pre sale rate', async function () {

        beforeEach(async function () {
          await increaseTimeTo(this.preSaleCloseTime - duration.seconds(10)); // set time to just before pre sale close
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({value: this.value, from: investor});
          let balance = await this.token.balanceOf(investor);
          balance.should.be.bignumber.equal(this.standardExpectedTokenAmount * this.preSaleRate);
        });

        // when using RefundableCrowdsale the "vault" holds the funds
        it('should forward funds to vault', async function () {
          const pre = web3.eth.getBalance(this.vault);
          await this.crowdsale.sendTransaction({value: this.value, from: investor});

          const post = web3.eth.getBalance(this.vault);
          post.minus(pre).should.be.bignumber.equal(this.value);
        });
      });
    });
  });

});
