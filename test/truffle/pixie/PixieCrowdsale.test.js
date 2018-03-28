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

const PixieCrowdsale = artifacts.require('PixieCrowdsale');
const PixieToken = artifacts.require('PixieToken');

contract.only('PixieCrowdsale', function ([owner, investor, wallet, purchaser, authorized, unauthorized, anotherAuthorized,
                                       authorizedTwo, authorizedThree, authorizedFour, authorizedFive]) {

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await PixieToken.new({from: owner});

    this.rate = new BigNumber(1);

    this.initialSupply = await this.token.initialSupply();

    this.amountAvailableForPurchase = this.initialSupply.times(0.4); // 40% of total supply

    this.openingTime = latestTime() + duration.seconds(60); // opens in 60 seconds
    this.closingTime = this.openingTime + duration.weeks(4); // closes in 4 week & 10 second

    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.privateSaleCloseTime = this.openingTime + duration.weeks(1); // private sale to close 1 week after opening
    this.privateSaleRate = new BigNumber(3);

    this.preSaleCloseTime = this.openingTime + duration.weeks(2); // pre sale to close 2 weeks after opening
    this.preSaleRate = new BigNumber(2);

    this.minContribution = etherToWei(0.1); // 1.0 ETH
    this.maxContribution = etherToWei(10000); // 10000 ETH

    this.goal = etherToWei(17500);
    this.cap = etherToWei(65000);

    this.value = this.minContribution;
    this.standardExpectedTokenAmount = this.rate.mul(this.value);

    this.crowdsale = await PixieCrowdsale.new(wallet, this.token.address, {from: owner});

    // ensure tokens can be transferred from crowdsale
    await this.token.transfer(this.crowdsale.address, this.amountAvailableForPurchase, {from: owner});

    // approve so they can invest in crowdsale
    await this.crowdsale.addToWhitelist(owner);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(wallet);
    await this.crowdsale.addToWhitelist(purchaser);

    // used in whitelist testing
    await this.crowdsale.addToWhitelist(authorized);
    await this.crowdsale.addToWhitelist(authorizedTwo);
    await this.crowdsale.addToWhitelist(authorizedThree);
    await this.crowdsale.addToWhitelist(authorizedFour);
    await this.crowdsale.addToWhitelist(authorizedFive);

    // ensure crowdsale address is whitelisted to transfer tokens
    // this.token.addAddressToWhitelist(this.crowdsale.address, {from: owner});

    this.vault = await this.crowdsale.vault();
  });

  after(async function () {
    console.log('Crowdsale Owner', await this.crowdsale.owner());
    console.log('test owner', owner);
    console.log('test investor', investor);
    console.log('test wallet', wallet);
    console.log('test purchaser', purchaser);
    console.log('getNow', (await await this.crowdsale.getNow()).toString(10));
    console.log('hasClosed', await this.crowdsale.hasClosed());
    console.log('isCrowdsaleOpen', await this.crowdsale.isCrowdsaleOpen());
    console.log('isFinalized', await this.crowdsale.isFinalized());
    console.log('capReached', await this.crowdsale.capReached());
    console.log('cap', (await this.crowdsale.cap()).toString(10));
    console.log('min contribution', (await this.crowdsale.min()).toString(10));
    console.log('max contribution', (await this.crowdsale.max()).toString(10));
    console.log('goal', (await this.crowdsale.goal()).toString(10));
    console.log('paused', await this.crowdsale.paused());
    console.log('openingTime', (await this.crowdsale.openingTime()).toString(10));
    console.log('closingTime', (await this.crowdsale.closingTime()).toString(10));
    console.log('privateSaleCloseTime', (await this.crowdsale.privateSaleCloseTime()).toString(10));
    console.log('privateSaleRate', (await this.crowdsale.privateSaleRate()).toString(10));
    console.log('preSaleCloseTime', (await this.crowdsale.preSaleCloseTime()).toString(10));
    console.log('preSaleRate', (await this.crowdsale.preSaleRate()).toString(10));
  });

  describe('Crowdsale', function () {

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

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.send(this.maxContribution.minus(this.minContribution)).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
      });

      it('should reject payments that exceed cap', async function () {
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 10000 ETHER
        await this.crowdsale.buyTokens(purchaser, {value: this.maxContribution, from: purchaser});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 20000 ETHER
        await this.crowdsale.buyTokens(investor, {value: this.maxContribution, from: investor});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 30000 ETHER
        await this.crowdsale.buyTokens(authorized, {value: this.maxContribution, from: authorized});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 40000 ETHER
        await this.crowdsale.buyTokens(authorizedTwo, {value: this.maxContribution, from: authorizedTwo});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 50000 ETHER
        await this.crowdsale.buyTokens(authorizedThree, {value: this.maxContribution, from: authorizedThree});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 60000 ETHER
        await this.crowdsale.buyTokens(authorizedFour, {value: this.maxContribution, from: authorizedFour});
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // 65k max so rejected
        await assertRevert(this.crowdsale.buyTokens(authorizedFive, {value: this.maxContribution, from: authorizedFive}));
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);

        // send another 5K ETHER which will reach cap
        await this.crowdsale.buyTokens(authorizedFive, {value: etherToWei(5000), from: authorizedFive});

        capReached = await this.crowdsale.capReached();
        capReached.should.equal(true);

        // Ensure you cannot purchase anymore
        await assertRevert(this.crowdsale.buyTokens(authorizedFive, {value: this.minContribution, from: authorizedFive}));
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
    });

  });

  describe('FinalizableCrowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(10)); // force time to move on to just after pre-sale
    });

    it('cannot be finalized before ending', async function () {
      await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMRevert);
    });

    it('cannot be finalized by third party after ending', async function () {
      await increaseTimeTo(this.afterClosingTime + duration.seconds(1));
      await this.crowdsale.finalize({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('can be finalized by owner after ending', async function () {
      await increaseTimeTo(this.afterClosingTime + duration.seconds(1));
      await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
    });

    it('cannot be finalized twice', async function () {
      await increaseTimeTo(this.afterClosingTime + duration.seconds(1));
      await this.crowdsale.finalize({from: owner});
      await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMRevert);
    });

    it('logs finalized', async function () {
      await increaseTimeTo(this.afterClosingTime + duration.seconds(1));
      const {logs} = await this.crowdsale.finalize({from: owner});
      const event = logs.find(e => e.event === 'Finalized');
      should.exist(event);
    });

  });

  describe('TimedCrowdsale with timed open/close', function () {

    it('should be ended only after end', async function () {
      let isCrowdsaleOpen = await this.crowdsale.isCrowdsaleOpen();
      isCrowdsaleOpen.should.equal(false);

      let ended = await this.crowdsale.hasClosed();
      ended.should.equal(false);

      await increaseTimeTo(this.afterClosingTime);
      ended = await this.crowdsale.hasClosed();
      ended.should.equal(true);
    });

    describe('accepting payments', function () {

      it('should reject payments before start', async function () {
        let isCrowdsaleOpen = await this.crowdsale.isCrowdsaleOpen();
        isCrowdsaleOpen.should.equal(false);

        await this.crowdsale.send(this.minContribution).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, {from: purchaser, value: this.minContribution})
          .should.be.rejectedWith(EVMRevert);
      });

      it('should accept payments after start', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, {value: this.minContribution, from: purchaser}).should.be.fulfilled;
      });

      it('should reject payments after end', async function () {
        await increaseTimeTo(this.afterClosingTime + duration.seconds(1));
        await this.crowdsale.send(this.minContribution).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, {value: this.minContribution, from: purchaser})
          .should.be.rejectedWith(EVMRevert);
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
            await this.crowdsale.pause({from});

            const paused = await this.crowdsale.paused();
            assert.equal(paused, true);
          });

          it('emits a paused event', async function () {
            const {logs} = await this.crowdsale.pause({from});

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Pause');
          });
        });

        describe('when the token is paused', function () {
          beforeEach(async function () {
            await this.crowdsale.pause({from});
          });

          it('reverts', async function () {
            await assertRevert(this.crowdsale.pause({from}));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAuthorized;

        it('reverts', async function () {
          await assertRevert(this.crowdsale.pause({from}));
        });
      });
    });

    describe('unpause', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

        describe('when the token is paused', function () {
          beforeEach(async function () {
            await this.crowdsale.pause({from});
          });

          it('unpauses the token', async function () {
            await this.crowdsale.unpause({from});

            const paused = await this.crowdsale.paused();
            assert.equal(paused, false);
          });

          it('emits an unpaused event', async function () {
            const {logs} = await this.crowdsale.unpause({from});

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Unpause');
          });
        });

        describe('when the token is unpaused', function () {
          it('reverts', async function () {
            await assertRevert(this.crowdsale.unpause({from}));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAuthorized;

        it('reverts', async function () {
          await assertRevert(this.crowdsale.unpause({from}));
        });
      });
    });
  });

  describe('IndividualLimitsCrowdsale - min & max contributions', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
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

    it('should deny refunds before end', async function () {
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('should deny refunds after end if goal was reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
      await this.crowdsale.sendTransaction({value: this.minContribution, from: investor});

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if goal was not reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
      await this.crowdsale.sendTransaction({value: this.minContribution, from: investor});

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner});

      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({from: investor, gasPrice: 0}).should.be.fulfilled;

      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(this.minContribution);
    });

    it('should forward funds to wallet after end if goal was reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale

      // 10000 ETHER
      await this.crowdsale.sendTransaction({value: this.maxContribution, from: purchaser});
      let goalReached = await this.crowdsale.goalReached();
      goalReached.should.equal(false);

      // 7500 ETHER to reach soft cap
      await this.crowdsale.sendTransaction({value: etherToWei(7500), from: investor});
      goalReached = await this.crowdsale.goalReached();
      goalReached.should.equal(true);

      await increaseTimeTo(this.afterClosingTime);
      const pre = web3.eth.getBalance(wallet);

      await this.crowdsale.finalize({from: owner});

      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(etherToWei(17500));
    });
  });

  describe('Private/Pre ICO date restrictions - overridden _getTokenAmount()', function () {

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
