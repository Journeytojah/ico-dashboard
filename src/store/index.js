import Vue from "vue";
import Vuex from "vuex";
import * as actions from "./actions";
import * as mutations from "./mutation-types";
import createLogger from "vuex/dist/logger";
import {getNetIdString} from "../utils";

import {IcoToken, IcoTokenCrowdsale} from "../contracts/index";

const utils = require('../utils');

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createLogger()],
  state: {
    // connectivity
    account: null,
    currentNetwork: null,

    // token metadata
    token: '',
    tokenName: '',
    tokenSymbol: '',

    // crowdsale
    rate: null,
    weiRaised: null,

    // contract totals
    totalSupply: null
  },
  getters: {
  },
  mutations: {
    [mutations.SET_CROWDSALE_DETAILS](state, {rate, weiRaised, token}) {
      state.rate = rate;
      state.weiRaised = weiRaised;
      state.token = token;
    },
    [mutations.SET_CONTRACT_DETAILS](state, {name, symbol, totalSupply}) {
      state.totalSupply = totalSupply;
      state.tokenSymbol = symbol;
      state.tokenName = name;
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

          store.dispatch(actions.REFRESH_CONTRACT_DETAILS);
          store.dispatch(actions.REFRESH_CROWDSALE_DETAILS);
        });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}) {
      IcoToken.deployed()
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
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}) {
      IcoTokenCrowdsale.deployed()
        .then((contract) => {
          return Promise.all([contract.rate(), contract.weiRaised(), contract.token()]);
        })
        .then((results) => {
          commit(mutations.SET_CROWDSALE_DETAILS, {
            rate: results[0].toString(),
            weiRaised: results[1].toString(),
            token: results[2].toString()
          });
        });
    }
  }
});

export default store;
