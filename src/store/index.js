/* global web3:true */

import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutation-types';
import createLogger from 'vuex/dist/logger';
import { getNetIdString } from '../utils';

import { HomepriseToken, HomepriseCrowdsale } from '../contracts/index';
// import { ConfigurableCrowdsale, ConfigurableToken } from '../contracts/index';

const _token = HomepriseToken;
const _crowdsale = HomepriseCrowdsale;

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
    hardCap: 0,
    hardCapHuman: 0,
    softCap: 0,
    softCapHuman: 0,
    wallet: null,
    openingTime: 0,
    closingTime: 0,
    owner: null,
    minimumContribution: 0,
    minimumContributionHuman: null,
    vault: null,

    // semi-static values
    stage: [],

    //crowdsale dynamic
    weiRaised: 0,
    crowdsaleBalance: 0,
    contributions: 0,
    paused: null,
    softCapReached: false,
    // refund vault
    vaultBalance: 0,
    vaultState: null,
    whitelisted: null,
    kycWaitingList: []
  },
  getters: {
    isOwner: (state) => (state.owner && state.account) ? state.owner.toLowerCase() === state.account.toLowerCase() : false,
    inKycWaitingList: (state) => (state.kycWaitingList) ? state.kycWaitingList.includes(state.account) : false,
    icoState: (state) => {
      if (state.openingTime !== 0 && state.closingTime) {
        const now = new Date().getTime() / 1000;
        if (now > state.openingTime && now < state.closingTime) {
          if (now < state.closingTime) {
            return 'Private Sale';
          }

          if (now < state.preSaleCloseTime) {
            return 'Pre-TGE Sale';
          }

          return 'TGE Sale';
        }

        if (now > state.closingTime) {
          return 'Sale Closed';
        }

        if (now < state.openingTime) {
          return 'Sale Not Yet Open';
        }
      }

      return '';
    }
  },
  mutations: {
    [mutations.SET_STATIC_CROWDSALE_DETAILS](state, {
      // TODO: Add _goal, _cap, _rate
      rate,
      token,
      hardCap,
      softCap,
      wallet,
      openingTime,
      closingTime,
      address,
      owner,
      minimumContribution,
      vault,
      privateSaleCloseTime,
      privateSaleRate,
      preSaleCloseTime,
      preSaleRate
    }) {
      state.rate = rate;
      state.token = token;
      state.hardCap = hardCap.toNumber(10);
      state.hardCapHuman = hardCap.toString(10);
      state.softCap = softCap.toNumber(10);
      state.softCapHuman = softCap.toString(10);
      state.wallet = wallet;
      state.openingTime = openingTime.toString(10);
      state.closingTime = closingTime;
      state.address = address;
      state.owner = owner;
      state.minimumContribution = minimumContribution.toNumber(10);
      state.minimumContributionHuman = minimumContribution.toString(10);
      state.vault = vault;
      state.privateSaleCloseTime = privateSaleCloseTime;
      state.privateSaleRate = privateSaleRate;
      state.preSaleCloseTime = preSaleCloseTime;
      state.preSaleRate = preSaleRate;
      console.log('Rate: ' + rate);
      console.log('Token: ' + token);
      console.log('Hard cap: ' + hardCap);
      console.log('Wallet: ' + wallet);
      console.log('Start: ' + openingTime);
      console.log('Owner: ' + owner);
    },
    [mutations.SET_CROWDSALE_DETAILS](state, {
      weiRaised,
      owner,
      whitelisted,
      contributions,
      softCapReached,
      paused
    }) {
      state.owner = owner;
      state.weiRaised = weiRaised;
      state.whitelisted = whitelisted;
      state.contributions = contributions;
      state.softCapReached = softCapReached;
      state.paused = paused;
      console.log('Raised: ' + weiRaised);
      console.log('Whitelisted: ' + whitelisted);
      console.log('Contributions: ' + contributions);
      console.log('Soft Cap Reached: ' + softCapReached);
    },
    [mutations.SET_VAULT_BALANCE](state, vaultBalance) {
      state.vaultBalance = vaultBalance;

    },
    [mutations.SET_STATIC_CONTRACT_DETAILS](state, {name, symbol, totalSupply, address}) {
      state.tokenTotalSupply = totalSupply;
      state.tokenSymbol = symbol;
      state.tokenName = name;
      state.tokenAddress = address;
      console.log('Address: ' + address, 'Symbol: ' + symbol, 'Name: ' + name);
    },
    [mutations.SET_CONTRACT_DETAILS](state, {tokenBalance, crowdsaleBalance}) {
      state.tokenBalance = tokenBalance;
      state.crowdsaleBalance = crowdsaleBalance;
      console.log('Crowdsale balance: ' + crowdsaleBalance, 'Token balance: ' + tokenBalance);
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
        // console.log(accounts);
        return accounts;
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
        return accounts;
      });
    },
    [actions.INIT_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      _token.deployed()
      .then((contract) => {
        return Promise.all([
          contract.name(),
          contract.symbol(),
          contract.totalSupply({from: account}),
          contract.address,
        ]);
      })
      .then((results) => {
        // console.log(results[0]);
        console.log(results[0], results[1], results[2].toString(10), 'Token address: ' + results[3]);
        
        commit(mutations.SET_STATIC_CONTRACT_DETAILS, {
          name: results[0],
          symbol: results[1],
          totalSupply: results[2].toString(10),
          address: results[3],
        });
      });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      _token.deployed()
      .then((contract) => {
        // console.log(contract);
        return Promise.all([
          contract.balanceOf(account, {from: account}),
          contract.balanceOf(state.address, {from: account})
        ]);
      })
      .then((results) => {
        console.log('Crowdsale balance: ' + results[1].toString(10));
        console.log('Token balance: ' + results[0].toString(10));
        commit(mutations.SET_CONTRACT_DETAILS, {
          tokenBalance: results[0].toString(10),
          crowdsaleBalance: results[1].toString(10)
        });
      });
    },
    [actions.INIT_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      // console.log('INIT_CROWDSALE_DETAILS');
      _crowdsale.deployed()
      .then((contract) => {
        console.log('Contract deployed');
        return Promise.all([
          contract.rate(),
          contract.token(),
          contract.hardCap(),
          contract.softCap(),
          contract.wallet(),
          contract.openingTime(),
          contract.closingTime(),
          contract.address,
          contract.owner(),
          contract.minContribution(),
          contract.maxContribution(),
          contract.vault(),
          contract.privateSaleCloseTime(),
          contract.privateSaleRate(),
          contract.preSaleCloseTime(),
          contract.preSaleRate(),
        ]);
      })
      .then((results) => {
        commit(mutations.SET_STATIC_CROWDSALE_DETAILS, {
          rate: results[0].toNumber(10),
          token: results[1].toString(),
          hardCap: results[2],
          softCapReached: results[3],
          wallet: results[4].toString(),
          openingTime: results[5].toNumber(10),
          closingTime: results[6].toNumber(10),
          address: results[7],
          owner: results[8],
          minContribution: results[9],
          vault: results[11],
          privateSaleCloseTime: results[12].toNumber(10),
          privateSaleRate: results[13].toNumber(10),
          preSaleCloseTime: results[14].toNumber(10),
          preSaleRate: results[15].toNumber(10),
        });
      });
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      _crowdsale.deployed()
      .then((contract) => {
        return Promise.all([
          contract.rate(),
          contract.token(),
          contract.hardCap(),
          contract.softCap(),
          contract.wallet(),
          contract.openingTime(),
          contract.closingTime(),
          contract.address,
          contract.owner(),
          contract.minContribution(),
          contract.maxContribution(),
          contract.vault(),
          contract.privateSaleCloseTime(),
          contract.privateSaleRate(),
          contract.preSaleCloseTime(),
          contract.preSaleRate(),
          contract.weiRaised(),
          contract.whitelist(account),
          contract.contributions(account, {from: account}),
          contract.paused()
        ]);
      })
      .then((results) => {
        commit(mutations.SET_CROWDSALE_DETAILS, {
          rate: results[0].toNumber(10),
          token: results[1].toString(),
          hardCap: results[2],
          softCapReached: results[3],
          wallet: results[4].toString(),
          openingTime: results[5].toNumber(10),
          closingTime: results[6].toNumber(10),
          address: results[7],
          owner: results[8],
          minContribution: results[9],
          vault: results[11],
          privateSaleCloseTime: results[12].toNumber(10),
          privateSaleRate: results[13].toNumber(10),
          preSaleCloseTime: results[14].toNumber(10),
          preSaleRate: results[15].toNumber(10),
          weiRaised: results[0].toNumber(10),
          whitelisted: results[1],
          contributions: results[2].toNumber(10),
          paused: results[4]
        });
      });
    },
    [actions.ADD_TO_KYC_WAITING_LIST]({commit, dispatch, state}, kycAccount) {
      commit(mutations.PUSH_TO_KYC_WAITING_LIST, kycAccount);
    },
    [actions.APPROVE_KYC]({commit, dispatch, state}, kycAccount) {
      _crowdsale.deployed()
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
      _crowdsale.deployed()
      .then((contract) => {
        return contract.buyTokens(state.account, {value: contributionInWei, from: state.account});
      });
    },
    [actions.PAUSE_CONTRACT]({commit, dispatch, state}) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.pause({from: state.account});
      });
    },
    [actions.UNPAUSE_CONTRACT]({commit, dispatch, state}) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.unpause({from: state.account});
      });
    }
  }
});

export default store;
// console.log(store);
