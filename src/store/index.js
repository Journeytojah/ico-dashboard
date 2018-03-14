import Web3 from 'web3';

import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutation-types';
import createLogger from 'vuex/dist/logger';
import { getNetIdString } from '../utils';

import { PixieCrowdsale, PixieToken } from '../contracts/index';

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
    cap: 0,
    goal: 0,
    wallet: null,
    start: 0,
    end: 0,
    owner: null,
    min: 0,
    max: 0,
    vault: null,

    //crowdsale dynamic
    raised: 0,
    crowdsaleBalance: 0,
    contributions: 0,
    paused: null,
    goalReached: false,
    // refund vault
    vaultBalance: 0,
    vaultState: null,
    whitelisted: null,
    kycWaitingList: []
  },
  getters: {
    isOwner: (state) => (state.owner && state.account) ? state.owner.toLowerCase() === state.account.toLowerCase() : false,
    inKycWaitingList: (state) => (state.kycWaitingList) ? state.kycWaitingList.includes(state.account) : false
  },
  mutations: {
    [mutations.SET_STATIC_CROWDSALE_DETAILS](state, {
      rate,
      token,
      cap,
      goal,
      wallet,
      start,
      end,
      address,
      owner,
      min,
      max,
      vault
    }) {
      state.rate = rate;
      state.token = token;
      state.cap = cap;
      state.goal = goal;
      state.wallet = wallet;
      state.start = start;
      state.end = end;
      state.address = address;
      state.owner = owner;
      state.min = min;
      state.max = max;
      state.vault = vault;
    },
    [mutations.SET_CROWDSALE_DETAILS](state, {
      raised,
      whitelisted,
      contributions,
      goalReached

    }) {
      state.raised = raised;
      state.whitelisted = whitelisted;
      state.contributions = contributions;
      state.goalReached = goalReached;
    },
    [mutations.SET_VAULT_BALANCE](state, vaultBalance) {
      state.vaultBalance = vaultBalance;

    },
    [mutations.SET_STATIC_CONTRACT_DETAILS](state, {name, symbol, totalSupply, address}) {
      state.tokenTotalSupply = totalSupply;
      state.tokenSymbol = symbol;
      state.tokenName = name;
      state.tokenAddress = address;
    },
    [mutations.SET_CONTRACT_DETAILS](state, {tokenBalance, crowdsaleBalance}) {
      state.tokenBalance = tokenBalance;
      state.crowdsaleBalance = crowdsaleBalance;
    },
    [mutations.SET_ACCOUNT](state, account) {
      state.account = account;
    },
    [mutations.SET_CURRENT_NETWORK](state, currentNetwork) {
      state.currentNetwork = currentNetwork;
    },
    [mutations.PUSH_TO_KYC_WAITING_LIST](state, kycAccount) {
      state.kycWaitingList.push(kycAccount);
      Vue.set(state, 'kycWaitingList', state.kycWaitingList);
    },
    [mutations.REMOVE_FROM_KYC_WAITING_LIST](state, kycAccount) {
      state.kycWaitingList = state.kycWaitingList.filter(e => e !== kycAccount);
      Vue.set(state, 'kycWaitingList', state.kycWaitingList);
    }
  },
  actions: {
    [actions.GET_CURRENT_NETWORK]({commit, dispatch, state}) {
      getNetIdString()
      .then((currentNetwork) => {
        commit(mutations.SET_CURRENT_NETWORK, currentNetwork);
      });
    },
    [actions.INIT_APP]({commit, dispatch, state}) {
      // use Web3?
      web3.eth.getAccounts()
      .then((accounts) => {

        // store the account
        commit(mutations.SET_ACCOUNT, accounts[0]);

        store.dispatch(actions.INIT_CONTRACT_DETAILS, accounts[0]);
        store.dispatch(actions.INIT_CROWDSALE_DETAILS, accounts[0]);
      });
    },
    [actions.REFRESH_APP]({commit, dispatch, state}) {
      // use Web3?
      web3.eth.getAccounts()
      .then((accounts) => {

        // store the account
        commit(mutations.SET_ACCOUNT, accounts[0]);

        store.dispatch(actions.REFRESH_CONTRACT_DETAILS, accounts[0]);
        store.dispatch(actions.REFRESH_CROWDSALE_DETAILS, accounts[0]);
        store.dispatch(actions.VAULT_BALANCE);
      });
    },
    [actions.INIT_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      PixieToken.deployed()
      .then((contract) => {
        return Promise.all([
          contract.name(),
          contract.symbol(),
          contract.totalSupply({from: account}),
          contract.address
        ]);
      })
      .then((results) => {
        commit(mutations.SET_STATIC_CONTRACT_DETAILS, {
          name: results[0],
          symbol: results[1],
          totalSupply: results[2].toString(10),
          address: results[3]
        });
      });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      PixieToken.deployed()
      .then((contract) => {
        return Promise.all([
          contract.balanceOf(account, {from: account}),
          contract.balanceOf(state.address, {from: account}),
        ]);
      })
      .then((results) => {
        commit(mutations.SET_CONTRACT_DETAILS, {
          tokenBalance: results[0].toNumber(10),
          crowdsaleBalance: results[1].toNumber(10)
        });
      });
    },
    [actions.INIT_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      PixieCrowdsale.deployed()
      .then((contract) => {
        return Promise.all([
          contract.rate(),
          contract.token(),
          contract.cap(),
          contract.goal(),
          contract.wallet(),
          contract.openingTime(),
          contract.closingTime(),
          contract.address,
          contract.owner(),
          contract.min(),
          contract.max(),
          contract.vault()
        ]);
      })
      .then((results) => {
        commit(mutations.SET_STATIC_CROWDSALE_DETAILS, {
          rate: results[0].toNumber(10),
          token: results[1].toString(),
          cap: results[2].toNumber(10),
          goal: results[3].toNumber(10),
          wallet: results[4].toString(),
          start: results[5].toNumber(10),
          end: results[6].toNumber(10),
          address: results[7],
          owner: results[8],
          min: results[9].toNumber(10),
          max: results[10].toNumber(10),
          vault: results[11],
        });
      });
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      PixieCrowdsale.deployed()
      .then((contract) => {
        return Promise.all([
          contract.weiRaised(),
          contract.whitelist(account),
          contract.contributions(account, {from: account}),
          contract.goalReached()
        ]);
      })
      .then((results) => {
        commit(mutations.SET_CROWDSALE_DETAILS, {
          raised: results[0].toNumber(10),
          whitelisted: results[1],
          contributions: results[2].toNumber(10),
          goalReached: results[3]
        });
      });
    },
    [actions.ADD_TO_KYC_WAITING_LIST]({commit, dispatch, state}, kycAccount) {
      commit(mutations.PUSH_TO_KYC_WAITING_LIST, kycAccount);
    },
    [actions.APPROVE_KYC]({commit, dispatch, state}, kycAccount) {
      PixieCrowdsale.deployed()
      .then((contract) => {
        return contract.addToWhitelist(kycAccount, {from: state.account});
      })
      .then((res) => commit(mutations.REMOVE_FROM_KYC_WAITING_LIST, kycAccount));
    },
    [actions.VAULT_BALANCE]({commit, dispatch, state}) {
      if (state.vault) {
        web3.eth.getBalance(state.vault)
        .then((result) => {
          commit(mutations.SET_VAULT_BALANCE, result.toString(10));
        });
      }
    },
    [actions.CONTRIBUTE_WEI]({commit, dispatch, state}, contributionInWei) {
      PixieCrowdsale.deployed()
      .then((contract) => {
        return contract.buyTokens(state.account, {value: contributionInWei, from: state.account});
      });
    }
  }
});

export default store;
