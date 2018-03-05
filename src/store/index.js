import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions'
import * as mutations from './mutation-types'
import _ from 'lodash'
import Web3 from 'web3'
import axios from 'axios'
import createLogger from 'vuex/dist/logger'
import {getNetIdString} from "../utils";

import {IcoToken} from '../contracts/index'

const utils = require('../utils');

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createLogger()],
  state: {
    // connectivity
    account: null,
    currentNetwork: null,

    // contract metadata
    contract: null,
    contractName: '',
    contractSymbol: '',

    // contract totals
    totalSupply: null
  },
  getters: {
  },
  mutations: {
    [mutations.SET_CONTRACT_DETAILS](state, {name, symbol, totalSupply}) {
      state.totalSupply = totalSupply;
      state.contractSymbol = symbol;
      state.contractName = name;
    },
    [mutations.SET_CONTRACT](state, contract) {
      state.contract = contract
    },
    [mutations.SET_ACCOUNT](state, account) {
      state.account = account
    },
    [mutations.SET_CURRENT_NETWORK](state, currentNetwork) {
      state.currentNetwork = currentNetwork
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
          // TODO add refresh cycle / timeout

          // store the account
          commit(mutations.SET_ACCOUNT, accounts[0]);

          // init the KODA contract
          dispatch(actions.INIT_CONTRACT);
        });
    },
    [actions.INIT_CONTRACT]({commit, dispatch, state}) {
      commit(mutations.SET_CONTRACT, IcoToken);

      store.dispatch(actions.REFRESH_CONTRACT_DETAILS);
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}) {
      state.contract.deployed()
        .then((contract) => {
          return Promise.all([contract.name(), contract.symbol(), contract.totalSupply()]);
        })
        .then((results) => {
          commit(mutations.SET_CONTRACT_DETAILS, {
            name: results[0],
            symbol: results[1],
            totalSupply: results[2].toString()
          });
        });
    }
  }
});

export default store;
