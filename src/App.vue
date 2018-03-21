<template>
  <v-app id="inspire">
    <v-toolbar dark color="primary">
      <v-toolbar-title>Pixie Token Sale</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn flat>
          <v-icon>home</v-icon> Dashboard
          <router-link :to="{ name: 'dashboard' }"></router-link>
        </v-btn>
      <v-btn flat>
        <v-icon>monetization_on</v-icon>Token
        <router-link :to="{ name: 'token' }"></router-link>
      </v-btn>
      <v-btn flat>
        <v-icon>account_balance</v-icon>Vault
        <router-link :to="{ name: 'vault' }"></router-link>
      </v-btn>
      <v-btn flat>
        <v-icon>supervisor_account</v-icon>KYC
        <router-link :to="{ name: 'kyc' }"></router-link>
      </v-btn>
      <v-btn flat>
        <v-icon>gavel</v-icon>Account
        <router-link :to="{ name: 'account' }"></router-link>
      </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-parallax src="https://vuetifyjs.com/static/doc-images/parallax/material2.jpg" height="100%">
      <v-layout align-center justify-center pa-3>
      <router-view></router-view>
    </v-layout>
    </v-parallax>
      <v-footer>
      <v-flex>
        <current-network></current-network>
      </v-flex>
    </v-footer>
  </v-app>

    <!--<div class="container">-->
      <!--<div class="header clearfix">-->
        <!--<nav>-->
          <!--<ul class="nav float-right">-->
            <!--<li class="nav-item" v-if="isOwner">-->
              <!--<b-badge  pill variant="success">OWNER</b-badge>-->
            <!--</li>-->
            <!--<li class="nav-item">-->
              <!--<router-link :to="{ name: 'dashboard' }" class="nav-link">Home</router-link>-->
            <!--</li>-->
            <!--<li class="nav-item">-->
              <!--<router-link :to="{ name: 'token' }" class="nav-link">Token</router-link>-->
            <!--</li>-->
            <!--<li class="nav-item">-->
              <!--<router-link :to="{ name: 'vault' }" class="nav-link">Vault</router-link>-->
            <!--</li>-->
            <!--<li class="nav-item">-->
              <!--<router-link :to="{ name: 'kyc' }" class="nav-link">KYC</router-link>-->
            <!--</li>-->
            <!--<li class="nav-item">-->
              <!--<router-link :to="{ name: 'account' }" class="nav-link">Account</router-link>-->
            <!--</li>-->
          <!--</ul>-->
        <!--</nav>-->

        <!--<h3 class="text-muted">Pixie TGE</h3>-->
      <!--</div>-->

      <!--<router-view></router-view>-->

      <!--<div class="footer">-->
        <!--<hr/>-->
        <!--<b-badge>-->
          <!--<current-network></current-network>-->
        <!--</b-badge>-->
      <!--</div>-->

  <!--</div>-->
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
        this.$store.dispatch(actions.REFRESH_APP);

        this.accountInterval = setInterval(() => {
          this.$store.dispatch(actions.REFRESH_APP);
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
