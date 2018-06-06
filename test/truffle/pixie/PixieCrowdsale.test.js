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
const RefundVault = artifacts.require('RefundVault');

contract('PixieCrowdsale', function ([owner, investor, wallet, purchaser, authorized, unauthorized, anotherAuthorized,
                                       authorizedTwo, authorizedThree, authorizedFour, authorizedFive]) {

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await PixieToken.new();

    this.crowdsale = await PixieCrowdsale.new(wallet, this.token.address);

    this.initialSupply = await this.token.initialSupply();
    this.amountAvailableForPurchase = this.initialSupply.times(0.4); // 40% of total supply

    this.openingTime = latestTime() + duration.seconds(60); // opens in 60 seconds
    this.closingTime = this.openingTime + duration.weeks(4); // closes in 4 week & 10 second
    this.privateSaleCloseTime = this.openingTime + duration.weeks(1); // private sale to close 1 week after opening
    this.preSaleCloseTime = this.openingTime + duration.weeks(2); // pre sale to close 2 weeks after opening
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.privateSaleRate = await this.crowdsale.privateSaleRate();
    this.preSaleRate = await this.crowdsale.preSaleRate();
    this.rate = await this.crowdsale.rate();

    this.minContribution = await this.crowdsale.minimumContribution();

    this.softCap = await this.crowdsale.softCap();
    this.hardCap = await this.crowdsale.hardCap();

    this.value = this.minContribution;
    this.standardExpectedTokenAmount = this.rate.mul(this.value);
    this.preSaleExpectedTokenAmount = this.preSaleRate.mul(this.value);
    this.privateSaleExpectedTokenAmount = this.privateSaleRate.mul(this.value);

    this.vault = await this.crowdsale.vault();
    this.refundVault = await RefundVault.at(this.vault);

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

    // ensure owner and all accounts are whitelisted
    assert.isTrue(await this.token.whitelist(owner));

    await this.token.addAddressesToWhitelist([
      investor, wallet, purchaser, authorized, unauthorized, anotherAuthorized,
      authorizedTwo, authorizedThree, authorizedFour, authorizedFive
    ]);

    // ensure the crowdsale can transfer tokens - whitelist in token
    await this.token.addAddressToWhitelist(this.crowdsale.address);

    // transfer balance to crowdsale to allow ICO token distribution
    await this.token.transfer(this.crowdsale.address, this.amountAvailableForPurchase);
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
    console.log('paused', await this.crowdsale.paused());

    console.log('hardCapReached', await this.crowdsale.hardCapReached());
    console.log('hardCap', this.hardCap.toString(10));
    console.log('softCap', this.softCap.toString(10));
    console.log('min contribution', (await this.crowdsale.minimumContribution()).toString(10));
    console.log('value', this.value.toString(10));
    console.log('initialSupply', this.initialSupply.toString(10));
    console.log('amountAvailableForPurchase', this.amountAvailableForPurchase.toString(10));

    console.log('openingTime', (await this.crowdsale.openingTime()).toString(10));
    console.log('closingTime', (await this.crowdsale.closingTime()).toString(10));
    console.log('privateSaleCloseTime', (await this.crowdsale.privateSaleCloseTime()).toString(10));
    console.log('preSaleCloseTime', (await this.crowdsale.preSaleCloseTime()).toString(10));

    console.log('Presale ICO tokens per ETH', (await this.crowdsale.preSaleRate()).toString(10));
    console.log('Private ICO tokens per ETH', (await this.crowdsale.privateSaleRate()).toString(10));
    console.log('Normal ICO tokens per ETH', (await this.crowdsale.rate()).toString(10));
  });

  describe('PixieCrowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale
    });

    describe('some basic calculations', function () {
      it('simple test to work out rates', async function () {
        let priceOfOneEthInUSD = new BigNumber("567.43");
        let priceOfOneTokenInUSD = new BigNumber("0.00125");

        console.log("Price of 1 ETH in USD", priceOfOneEthInUSD.toString(10));
        console.log("Price of 1 token in USD", priceOfOneTokenInUSD.toString(10));

        ///////////
        // 18 DP //
        ///////////

        let numberOfTokensPerEth = priceOfOneEthInUSD.div(priceOfOneTokenInUSD);
        console.log("number of tokens PER ETH (18 DP) - ", numberOfTokensPerEth.toString(10));

        let numberOfTokens12Pt5PctDiscount = numberOfTokensPerEth.times(1.125); // 12.5% discount
        console.log("number of tokens PER ETH (18 DP) - 12.5% discount - ", numberOfTokens12Pt5PctDiscount.toString(10));

        let numberOfTokens25PctDiscount = numberOfTokensPerEth.times(1.25); // 25% discount
        console.log("number of tokens PER ETH (18 DP) - 25% discount - ", numberOfTokens25PctDiscount.toString(10));

        //////////
        // 6 DP //
        //////////

        let numberOfTokensAt6DP = numberOfTokensPerEth.times(3);
        console.log("number of tokens PER ETH (6 DP) - ", numberOfTokensAt6DP.toString(10)); // 18/6 = 3 times

        numberOfTokens12Pt5PctDiscount = numberOfTokensPerEth.times(3).times(1.125); // 12.5% discount
        console.log("number of tokens PER ETH (6 DP) - 12.5% discount - ", numberOfTokens12Pt5PctDiscount.toString(10));

        numberOfTokens25PctDiscount = numberOfTokensPerEth.times(3).times(1.25); // 25% discount
        console.log("number of tokens PER ETH (6 DP) - 25% discount - ", numberOfTokens25PctDiscount.toString(10));
      });
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
      it('should accept payments within hard cap', async function () {
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
      });

      it('should reject payments that exceed hard cap', async function () {
        let hardCapReached = await this.crowdsale.hardCapReached();
        hardCapReached.should.equal(false);

        await this.crowdsale.buyTokens(authorizedFour, {
          value: this.hardCap.minus(etherToWei(1)),
          from: authorizedFour
        });
        hardCapReached = await this.crowdsale.hardCapReached();
        hardCapReached.should.equal(false);

        // +1 ether
        await this.crowdsale.buyTokens(authorizedFive, {value: etherToWei(1), from: authorizedFive});
        hardCapReached = await this.crowdsale.hardCapReached();
        hardCapReached.should.equal(true);

        // Ensure you cannot purchase anymore
        await assertRevert(this.crowdsale.buyTokens(authorizedFive, {value: etherToWei(1), from: authorizedFive}));
      });
    });

    describe('ending', function () {
      it('should not reach hard cap if sent under hard cap', async function () {
        let hardCapReached = await this.crowdsale.hardCapReached();
        hardCapReached.should.equal(false);
        await this.crowdsale.send(this.minContribution);
        hardCapReached = await this.crowdsale.hardCapReached();
        hardCapReached.should.equal(false);
      });
    });

  });

  describe('FinalizableCrowdsale', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(10)); // force time to move on to just after pre-sale
    });

    it('cannot be finalized by third party', async function () {
      await this.crowdsale.finalize({from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('can be finalized by owner (before end)', async function () {
      await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
    });

    it('can be finalized by owner under goal to allow refunds', async function () {
      let startingInvestorBalance = web3.eth.getBalance(investor);
      await this.crowdsale.buyTokens(investor, {value: this.value, from: investor}).should.be.fulfilled;

      let contribution = await this.crowdsale.contributions(investor, {from: investor});
      contribution.should.be.bignumber.equal(this.value);

      let vaultAccountBalance = await this.refundVault.deposited(investor, {from: investor});
      vaultAccountBalance.should.be.bignumber.equal(this.value);

      // spent
      let postContributionInvestorBalance = web3.eth.getBalance(investor);
      postContributionInvestorBalance.should.be.bignumber.lessThan(startingInvestorBalance);

      await this.crowdsale.finalize({from: owner}).should.be.fulfilled;

      await this.refundVault.refund(investor, {from: owner});

      contribution = await this.crowdsale.contributions(investor, {from: investor});
      contribution.should.be.bignumber.equal(this.value);

      // balance should be reduced to zero
      vaultAccountBalance = await this.refundVault.deposited(investor, {from: investor});
      vaultAccountBalance.should.be.bignumber.equal(0);

      // we should have the value back in the investors account
      let postRefundInvestorBalance = web3.eth.getBalance(investor);
      postRefundInvestorBalance.minus(this.value).should.be.bignumber.equal(postContributionInvestorBalance);
    });

    it('can be finalized by owner over goal and all contributions send to wallet', async function () {
      let startingWalletBalance = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, {value: this.softCap, from: investor}).should.be.fulfilled;
      let softCapReached = await this.crowdsale.softCapReached();
      softCapReached.should.equal(true);

      let vaultBalance = web3.eth.getBalance(this.refundVault.address);
      vaultBalance.should.be.bignumber.equal(this.softCap);

      await this.crowdsale.finalize({from: owner}).should.be.fulfilled;

      // balance should be reduced to zero
      vaultBalance = web3.eth.getBalance(this.refundVault.address);
      vaultBalance.should.be.bignumber.equal(0);

      let postFinalizeWalletBalance = web3.eth.getBalance(wallet);
      startingWalletBalance.plus(this.softCap).should.be.bignumber.equal(postFinalizeWalletBalance);
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

  describe('Management whitelisting', function () {

    beforeEach(async function () {
      await this.crowdsale.addManyToWhitelist([authorized]);
      await this.crowdsale.addToManagementWhitelist(anotherAuthorized);
    });

    describe('finalize()', function () {
      it('should be able to invoke finalize() when owner', async function () {
        await this.crowdsale.finalize({from: owner});
      });

      it('should not be able to invoke finalize() when added to management whitelist', async function () {
        await assertRevert(this.crowdsale.finalize({from: anotherAuthorized}));
      });
    });

    describe('beneficiary whitelisting', function () {
      it('should be able to add many to whitelist when in management', async function () {
        let isAuthorized = await this.crowdsale.whitelist(unauthorized);
        isAuthorized.should.equal(false);

        await this.crowdsale.addManyToWhitelist([unauthorized], {from: anotherAuthorized});

        isAuthorized = await this.crowdsale.whitelist(unauthorized);
        isAuthorized.should.equal(true);
      });

      it('should not be able to add many to whitelist when not in management', async function () {
        let isAuthorized = await this.crowdsale.whitelist(unauthorized);
        isAuthorized.should.equal(false);

        await assertRevert(this.crowdsale.addManyToWhitelist([unauthorized], {from: purchaser}));

        isAuthorized = await this.crowdsale.whitelist(unauthorized);
        isAuthorized.should.equal(false);
      });
    });

    describe('management whitelisting', function () {
      it('should be able to add many to management whitelist when in management whitelist', async function () {
        let isAuthorized = await this.crowdsale.managementWhitelist(authorizedFour);
        isAuthorized.should.equal(false);

        await this.crowdsale.addToManagementWhitelist(authorizedFour, {from: anotherAuthorized});

        isAuthorized = await this.crowdsale.managementWhitelist(authorizedFour);
        isAuthorized.should.equal(true);
      });

      it('should not be able to add many to management whitelist when not in management whitelist', async function () {
        let isAuthorized = await this.crowdsale.managementWhitelist(unauthorized);
        isAuthorized.should.equal(false);

        await assertRevert(this.crowdsale.addToManagementWhitelist(unauthorized, {from: purchaser}));

        isAuthorized = await this.crowdsale.managementWhitelist(unauthorized);
        isAuthorized.should.equal(false);
      });

      it('should be able to add to beneficiary whitelist if caller is part of the management team', async function () {
        let isAuthorized = await this.crowdsale.managementWhitelist(anotherAuthorized);
        isAuthorized.should.equal(true);

        let isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(false);

        await this.crowdsale.addToWhitelist(unauthorized, {from: anotherAuthorized});

        isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(true);
      });

      it('should be able to add many to beneficiary whitelist if caller is part of the management team', async function () {
        let isAuthorized = await this.crowdsale.managementWhitelist(anotherAuthorized);
        isAuthorized.should.equal(true);

        let isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(false);

        await this.crowdsale.addManyToWhitelist([unauthorized], {from: anotherAuthorized});

        isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(true);
      });

      it('should be able to remove from beneficiary whitelist if caller is part of the management team', async function () {
        // Add them
        let isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(false);

        await this.crowdsale.addToWhitelist(unauthorized, {from: anotherAuthorized});

        isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(true);

        // Remove them
        await this.crowdsale.removeFromWhitelist(unauthorized, {from: anotherAuthorized});

        isWhitelisterAuthorized = await this.crowdsale.whitelist(unauthorized);
        isWhitelisterAuthorized.should.equal(false);
      });

      it('should not be able to add to the beneficiary whitelist if caller is not part of the management team', async function () {
        await assertRevert(this.crowdsale.addToWhitelist(unauthorized, {from: unauthorized}));
      });

      it('should not be able to add many to the beneficiary whitelist if caller is not part of the management team', async function () {
        await assertRevert(this.crowdsale.addManyToWhitelist([unauthorized], {from: unauthorized}));
      });

      it('should not be able to remove from beneficiary whitelist if caller is not part of the management team', async function () {
        await assertRevert(this.crowdsale.removeFromWhitelist(unauthorized, {from: unauthorized}));
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

  describe('IndividualLimitsCrowdsale - min', function () {
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

      it('should allow multiple contributions ', async function () {

        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;
        await this.crowdsale.send(this.minContribution).should.be.fulfilled;

        const postContribution = await this.crowdsale.contributions(owner);
        postContribution.should.be.bignumber.equal(this.minContribution.times(5));
      });
    });
  });

  describe('Refundable with soft cap', function () {

    it('should deny refunds if not finalized', async function () {
      await this.refundVault.refund(investor, {from: investor}).should.be.rejectedWith(EVMRevert);

      await increaseTimeTo(this.openingTime + duration.seconds(5));
      await this.refundVault.refund(investor, {from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if soft cap was not reached', async function () {
      await increaseTimeTo(this.openingTime + duration.seconds(5)); // force time to move on to just after opening

      await this.crowdsale.sendTransaction({value: this.minContribution, from: investor});

      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.finalize({from: owner});

      const pre = web3.eth.getBalance(investor);
      await this.refundVault.refund(investor, {from: investor, gasPrice: 0}).should.be.fulfilled;

      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(this.minContribution);
    });

    it('should forward funds to wallet after end if soft cap was reached', async function () {
      await increaseTimeTo(this.preSaleCloseTime + duration.seconds(1)); // force time to move on to just after pre-sale

      await this.crowdsale.sendTransaction({value: this.softCap.minus(etherToWei(1)), from: purchaser});
      let softCapReached = await this.crowdsale.softCapReached();
      softCapReached.should.equal(false);

      // +1 ETHER to reach soft cap
      await this.crowdsale.sendTransaction({value: etherToWei(1), from: investor});
      softCapReached = await this.crowdsale.softCapReached();
      softCapReached.should.equal(true);

      await increaseTimeTo(this.afterClosingTime);
      const pre = web3.eth.getBalance(wallet);

      await this.crowdsale.finalize({from: owner});

      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(this.softCap);
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
        balance.should.be.bignumber.equal(this.privateSaleExpectedTokenAmount);
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
        balance.should.be.bignumber.equal(this.preSaleExpectedTokenAmount);
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
