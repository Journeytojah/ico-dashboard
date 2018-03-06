import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as mutations from './mutation-types'
import createLogger from 'vuex/dist/logger'
import { getNetIdString } from '../utils'

import { ABCTokenCrowdsale, ABCToken } from '../contracts/index'

const utils = require('../utils')

Vue.use(Vuex)

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
    tokenBalance: null,
    tokenTotalSupply: null,

    // crowdsale
    address: null,
    rate: null,
    raised: null,
    cap: null,
    goal: null,
    wallet: null,
    start: null,
    end: null,

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
      address
    }) {
      state.rate = rate
      state.raised = raised
      state.token = token
      state.cap = cap
      state.goal = goal
      state.wallet = wallet
      state.start = start
      state.end = end
      state.address = address
    },
    [mutations.SET_CONTRACT_DETAILS](state, {name, symbol, totalSupply, address, balance}) {
      state.tokenTotalSupply = totalSupply
      state.tokenSymbol = symbol
      state.tokenName = name
      state.tokenAddress = address
      state.tokenBalance = balance
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
          commit(mutations.SET_CURRENT_NETWORK, currentNetwork)
        })
    },
    [actions.INIT_APP]({commit, dispatch, state}, account) {
      web3.eth.getAccounts()
        .then((accounts) => {
          // TODO add refresh cycle / timeout

          // store the account
          commit(mutations.SET_ACCOUNT, accounts[0])

          store.dispatch(actions.REFRESH_CONTRACT_DETAILS, accounts[0])
          store.dispatch(actions.REFRESH_CROWDSALE_DETAILS)
        })
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      console.log(account);
      ABCToken.deployed()
        .then((contract) => {
          return Promise.all([
            contract.name(),
            contract.symbol(),
            contract.totalSupply({from: account}),
            contract.address,
            contract.balanceOf(account, {from: account})
          ])
        })
        .then((results) => {
          commit(mutations.SET_CONTRACT_DETAILS, {
            name: results[0],
            symbol: results[1],
            totalSupply: results[2].toString(10),
            address: results[3],
            balance: results[4].toString(10)
          })
        })
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}) {
      ABCTokenCrowdsale.deployed()
        .then((contract) => {
          return Promise.all([
            contract.rate(),
            contract.weiRaised(),
            contract.token(),
            contract.cap(),
            contract.goal(),
            contract.wallet(),
            contract.openingTime(),
            contract.closingTime(),
            contract.address,
          ])
        })
        .then((results) => {
          commit(mutations.SET_CROWDSALE_DETAILS, {
            rate: Web3.utils.fromWei(results[0].toString(10), 'ether'),
            raised: parseInt(Web3.utils.fromWei(results[1].toString(10), 'ether'), 10), // hmmm?
            token: results[2].toString(),
            cap: parseInt(Web3.utils.fromWei(results[3].toString(10), 'ether'), 10), // whole ether
            goal: parseInt(Web3.utils.fromWei(results[4].toString(10), 'ether'), 10), // whole ether
            wallet: results[5].toString(),
            start: results[6].toNumber(10),
            end: results[7].toNumber(10),
            address: results[8],
          })
        })
    }
  }
})

export default store
