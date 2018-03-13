<template>
  <div id="app">
    <div class="container">

      <div class="header clearfix">
        <nav>
          <ul class="nav float-right">
            <li class="nav-item" v-if="isOwner">
              <b-badge  pill variant="success">OWNER</b-badge>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'dashboard' }" class="nav-link">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'token' }" class="nav-link">Token</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'kyc' }" class="nav-link">KYC</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'account' }" class="nav-link">Account</router-link>
            </li>
          </ul>
        </nav>

        <h3 class="text-muted">ICO Dashboard</h3>
      </div>

      <router-view></router-view>

      <div class="footer">
        <hr/>
        <b-badge>
          <current-network></current-network>
        </b-badge>
      </div>

    </div>

  </div>
</template>

<script>
  /* global web3:true */

  import Web3 from 'web3';
  import {mapGetters, mapState} from 'vuex';
  import * as actions from './store/actions';
  import * as mutations from './store/mutation-types';
  import CurrentNetwork from './components/CurrentNetwork';

  export default {
    name: 'app',
    data() {
      return {
        accountInterval: null
      };
    },
    computed: {
      ...mapGetters([
        'isOwner',
      ])
    },
    components: {CurrentNetwork},
    mounted() {
      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      if (typeof web3 === 'undefined') {
        console.error('No web3 detected...');
        return;
      }

      if (web3) {
        // Use Mist / MetaMask's / provided provider
        window.web3 = new Web3(web3.currentProvider);

        // Bootstrap the full app
        this.$store.dispatch(actions.INIT_APP);

        this.accountInterval = setInterval(() => {
          this.$store.dispatch(actions.INIT_APP);
        }, 5000);

        // Find current network
        this.$store.dispatch(actions.GET_CURRENT_NETWORK);

      } else {
        // TODO fire action - WEB_3_NOT_FOUND - show error banner
      }
    },
    beforeDestroy () {
      clearInterval(this.accountInterval);
    }
  };
</script>

<style lang="scss">

  #app {

  }

  .header {
    margin: 20px;
  }
</style>
