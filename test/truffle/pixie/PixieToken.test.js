/* eslint-disable camelcase */
const assertRevert = require('../../helpers/assertRevert');

const PixieToken = artifacts.require('PixieToken');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('PixieToken', function ([_, owner, recipient, anotherAccount]) {


  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const DECIMALS = 18;
  const TOTAl_AMOUNT_OF_TOKENS = new BigNumber(100000000000).times(new BigNumber(10).pow(DECIMALS));

  beforeEach(async function () {
    this.token = await PixieToken.new({from: owner});
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = await this.token.totalSupply();

      totalSupply.should.be.bignumber.equal(TOTAl_AMOUNT_OF_TOKENS);
    });
  });

  describe('decimals', function () {
    it('returns the number of decimals', async function () {
      const decimals = await this.token.decimals();

      assert.equal(decimals, DECIMALS);
    });
  });

  describe('symbol', function () {
    it('returns the symbol', async function () {
      const symbol = await this.token.symbol();

      assert.equal(symbol, "PXE");
    });
  });

  describe('name', function () {
    it('returns the name', async function () {
      const name = await this.token.name();

      assert.equal(name, "Pixie Token");
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await this.token.balanceOf(anotherAccount);

        balance.should.be.bignumber.equal(0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const balance = await this.token.balanceOf(owner);

        balance.should.be.bignumber.equal(TOTAl_AMOUNT_OF_TOKENS);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, {from: owner}));
        });
      });

      describe('when the sender has enough balance', function () {
        it('transfers the requested amount', async function () {
          await this.token.transfer(to, TOTAl_AMOUNT_OF_TOKENS, {from: owner});

          const senderBalance = await this.token.balanceOf(owner);
          senderBalance.should.be.bignumber.equal(0);

          const recipientBalance = await this.token.balanceOf(to);
          recipientBalance.should.be.bignumber.equal(TOTAl_AMOUNT_OF_TOKENS);
        });

        it('emits a transfer event', async function () {
          const {logs} = await this.token.transfer(to, TOTAl_AMOUNT_OF_TOKENS, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert(logs[0].args.value.eq(TOTAl_AMOUNT_OF_TOKENS));
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.transfer(to, 100, {from: owner}));
      });
    });
  });

  describe('approve', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS;

        it('emits an approval event', async function () {
          const {logs} = await this.token.approve(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, {from: owner});
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

        it('emits an approval event', async function () {
          const {logs} = await this.token.approve(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, {from: owner});
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = TOTAl_AMOUNT_OF_TOKENS;
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await this.token.approve(spender, amount, {from: owner});

        const allowance = await this.token.allowance(owner, spender);
        allowance.should.be.bignumber.equal(amount);
      });

      it('emits an approval event', async function () {
        const {logs} = await this.token.approve(spender, amount, {from: owner});

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(amount));
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, TOTAl_AMOUNT_OF_TOKENS, {from: owner});
        });

        describe('when the owner has enough balance', function () {
          const amount = TOTAl_AMOUNT_OF_TOKENS;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(owner, to, amount, {from: spender});

            const senderBalance = await this.token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(0);

            const recipientBalance = await this.token.balanceOf(to);
            recipientBalance.should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(owner, to, amount, {from: spender});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(0);
          });

          it('emits a transfer event', async function () {
            const {logs} = await this.token.transferFrom(owner, to, amount, {from: spender});

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            assert(logs[0].args.value.eq(amount));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, {from: spender}));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, 99, {from: owner});
        });

        describe('when the owner has enough balance', function () {
          const amount = TOTAl_AMOUNT_OF_TOKENS;

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, {from: spender}));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, {from: spender}));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = TOTAl_AMOUNT_OF_TOKENS;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, {from: owner});
      });

      it('reverts', async function () {
        await assertRevert(this.token.transferFrom(owner, to, amount, {from: spender}));
      });
    });
  });

  describe('decrease approval', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS;

        it('emits an approval event', async function () {
          const {logs} = await this.token.decreaseApproval(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(0));
        });

        describe('when there was no approved amount before', function () {
          it('keeps the allowance to zero', async function () {
            await this.token.decreaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(0);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount.plus(1), {from: owner});
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(1);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

        it('emits an approval event', async function () {
          const {logs} = await this.token.decreaseApproval(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(0));
        });

        describe('when there was no approved amount before', function () {
          it('keeps the allowance to zero', async function () {
            await this.token.decreaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount.plus(1), {from: owner});
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(1);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = TOTAl_AMOUNT_OF_TOKENS;
      const spender = ZERO_ADDRESS;

      it('decreases the requested amount', async function () {
        await this.token.decreaseApproval(spender, amount, {from: owner});

        const allowance = await this.token.allowance(owner, spender);
        allowance.should.be.bignumber.equal(0);
      });

      it('emits an approval event', async function () {
        const {logs} = await this.token.decreaseApproval(spender, amount, {from: owner});

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(0));
      });
    });
  });

  describe('increase approval', function () {
    const amount = TOTAl_AMOUNT_OF_TOKENS;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          const {logs} = await this.token.increaseApproval(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, {from: owner});
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount.plus(1));
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = TOTAl_AMOUNT_OF_TOKENS.plus(1);

        it('emits an approval event', async function () {
          const {logs} = await this.token.increaseApproval(spender, amount, {from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, {from: owner});
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseApproval(spender, amount, {from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount.plus(1));
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await this.token.increaseApproval(spender, amount, {from: owner});

        const allowance = await this.token.allowance(owner, spender);
        allowance.should.be.bignumber.equal(amount);
      });

      it('emits an approval event', async function () {
        const {logs} = await this.token.increaseApproval(spender, amount, {from: owner});

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(amount));
      });
    });
  });
});
