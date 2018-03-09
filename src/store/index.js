import Web3 from 'web3';

import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutation-types';
import createLogger from 'vuex/dist/logger';
import {getNetIdString} from '../utils';

import {PixieCrowdsale, PixieToken} from '../contracts/index';

const utils = require('../utils');

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createLogger()],
  state: {
    // connectivity
    account: null,
    currentNetwork: null,

    // token metadata
    tokenAddress: '',
    token: '',
    tokenName: '',
    tokenSymbol: '',
    tokenBalance: 0,
    tokenTotalSupply: 0,

    // crowdsale
    address: null,
    rate: 0,
    raised: 0,
    cap: 0,
    goal: 0,
    wallet: null,
    start: 0,
    end: 0,
    crowdsaleBalance: 0,
    owner: null,

    whitelisted: null
  },
  getters: {},
  mutations: {
    [mutations.SET_CROWDSALE_DETAILS](state, {
      rate,
      raised,
      token,
      cap,
      goal,
      wallet,
      start,
      end,
      address,
      crowdsaleBalance,
      owner,
      whitelisted
    }) {
      state.rate = rate;
      state.raised = raised;
      state.token = token;
      state.cap = cap;
      state.goal = goal;
      state.wallet = wallet;
      state.start = start;
      state.end = end;
      state.address = address;
      state.crowdsaleBalance = crowdsaleBalance;
      state.owner = owner;
      state.whitelisted = whitelisted;
    },
    [mutations.SET_CONTRACT_DETAILS](state, {name, symbol, totalSupply, address, balance}) {
      state.tokenTotalSupply = totalSupply;
      state.tokenSymbol = symbol;
      state.tokenName = name;
      state.tokenAddress = address;
      state.tokenBalance = balance;
    },
    [mutations.SET_ACCOUNT](state, account) {
      state.account = account;
    },
    [mutations.SET_CURRENT_NETWORK](state, currentNetwork) {
      state.currentNetwork = currentNetwork;
    },
  },
  actions: {
    [actions.GET_CURRENT_NETWORK]({commit, dispatch, state}) {
      getNetIdString()
        .then((currentNetwork) => {
          commit(mutations.SET_CURRENT_NETWORK, currentNetwork);
        });
    },
    [actions.INIT_APP]({commit, dispatch, state}, account) {
      web3.eth.getAccounts()
        .then((accounts) => {
          // store the account
          commit(mutations.SET_ACCOUNT, accounts[0]);

          store.dispatch(actions.REFRESH_CONTRACT_DETAILS, accounts[0]);
          store.dispatch(actions.REFRESH_CROWDSALE_DETAILS, accounts[0]);
        });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      PixieToken.deployed()
        .then((contract) => {
          return Promise.all([
            contract.name(),
            contract.symbol(),
            contract.totalSupply({from: account}),
            contract.address,
            contract.balanceOf(account, {from: account})
          ]);
        })
        .then((results) => {
          commit(mutations.SET_CONTRACT_DETAILS, {
            name: results[0],
            symbol: results[1],
            totalSupply: results[2].toString(10),
            address: results[3],
            balance: results[4].toString(10)
          });
        });
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      Promise.all([
        PixieToken.deployed(),
        PixieCrowdsale.deployed()
      ])
        .then((contracts) => {
          return Promise.all([
            contracts[1].rate(),
            contracts[1].weiRaised(),
            contracts[1].token(),
            contracts[1].cap(),
            contracts[1].weiRaised(), // DUMMY
            contracts[1].wallet(),
            contracts[1].weiRaised(), // DUMMY
            contracts[1].weiRaised(), // DUMMY
            contracts[1].address,
            contracts[0].balanceOf(contracts[1].address, {from: account}),
            contracts[1].owner(),
            contracts[1].whitelist(account),
          ]);
        })
        .then((results) => {
          commit(mutations.SET_CROWDSALE_DETAILS, {
            rate: results[0].toNumber(10),
            raised: results[1].toNumber(10), // hmmm?
            token: results[2].toString(),
            cap: results[3].toNumber(10), // whole ether
            goal: results[4].toNumber(10), // whole ether
            wallet: results[5].toString(),
            start: results[6].toNumber(10),
            end: results[7].toNumber(10),
            address: results[8],
            crowdsaleBalance: results[9].toString(10),
            owner: results[10],
            whitelisted: results[11]
          });
        });
    }
  }
});

export default store;
