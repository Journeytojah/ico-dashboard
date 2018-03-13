<template>
  <div id="account">

    <b-jumbotron :header="tokenName" lead="Account details">
      <div class="row">
        <div class="col-lg-6">
          <h4>My Account</h4>
          <eth-address :hex="account"></eth-address>
        </div>

        <whitelisted :whitelisted="whitelisted"></whitelisted>

        <div class="col-lg-4">
          <h4>Token Balance</h4>
          <p>{{ tokenBalance }} {{ tokenSymbol }}</p>
        </div>

        <div class="col-lg-4">
          <h4>Contribution Total</h4>
          <p>{{ contributions }} <eth-symbol></eth-symbol></p>
        </div>
      </div>

      <hr/>

      <div class="row justify-content-lg-center">
        <div class="col-lg-6">
          <strong>Contribute:</strong>
          <b-button-group>
            <b-button variant="primary" @click="CONTRIBUTE_WEI(1)">1 <eth-symbol></eth-symbol></b-button>
            <b-button variant="primary" @click="CONTRIBUTE_WEI(25)">25 <eth-symbol></eth-symbol></b-button>
            <b-button variant="primary" @click="CONTRIBUTE_WEI(50)">50 <eth-symbol></eth-symbol></b-button>
            <b-button variant="primary" @click="CONTRIBUTE_WEI(100)">100 <eth-symbol></eth-symbol></b-button>
            <b-button variant="primary" @click="CONTRIBUTE_WEI(250)">250 <eth-symbol></eth-symbol></b-button>
          </b-button-group>
        </div>
      </div>
    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState, mapActions} from 'vuex';
  import EthAddress from './EthAddress.vue';
  import Whitelisted from './Whitelisted.vue';
  import EthSymbol from './EthSymbol';
  import * as actions from '@/store/actions';

  export default {
    name: 'dashboard',
    components: {EthAddress, Whitelisted, EthSymbol},
    computed: {
      ...mapState([
        'account',
        'tokenSymbol',
        'tokenName',
        'tokenBalance',
        'whitelisted',
        'contributions'
      ])
    },
    methods: {
      ...mapActions([
        actions.CONTRIBUTE_WEI
      ])
    },
  };
</script>

<style lang="scss" scoped>

</style>
