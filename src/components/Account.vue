<template>
  <div id="account">

    <b-jumbotron :header="tokenName" lead="Account details">
      <div class="row">
        <div class="col-lg-6">
          <h4>My Account</h4>
          <eth-address :hex="account"></eth-address>
        </div>

        <!-- <whitelisted :whitelisted="whitelisted"></whitelisted> -->

        <div class="col-lg-4">
          <h4>Token Balance</h4>
          <p>{{ tokenBalance }} {{ tokenSymbol }}</p>
        </div>

        <div class="col-lg-4">
          <h4>Contribution Total</h4>
          <p>{{ contributions }} <eth-symbol></eth-symbol></p>
        </div>
      </div>

    </b-jumbotron>

    <div class="row">
      <div class="col-lg-12">
        <span>Contribute:</span>
        <b-button-group>
          <b-button variant="primary" @click="CONTRIBUTE_WEI(1)">1 <eth-symbol></eth-symbol></b-button>
          <b-button variant="primary" @click="CONTRIBUTE_WEI(25)">25 <eth-symbol></eth-symbol></b-button>
          <b-button variant="primary" @click="CONTRIBUTE_WEI(50)">50 <eth-symbol></eth-symbol></b-button>
          <b-button variant="primary" @click="CONTRIBUTE_WEI(100)">100 <eth-symbol></eth-symbol></b-button>
          <b-button variant="primary" @click="CONTRIBUTE_WEI(250)">250 <eth-symbol></eth-symbol></b-button>
        </b-button-group>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-lg-12">
        <div class="alert alert-warning" role="alert" v-if="isOwner">
          <icon name="exclamation-triangle"></icon> Only the owner can pause the contract!

          <span class="pl-4">
            <b-button variant="primary" v-if="!paused" @click="PAUSE_CONTRACT(1)">Pause <icon name="pause"></icon></b-button>
            <b-button variant="primary" v-if="paused" @click="UNPAUSE_CONTRACT(25)">Unpause <icon name="play"></icon></b-button>
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>

  import {mapGetters, mapState, mapActions} from 'vuex';
  import EthAddress from './EthAddress.vue';
  import Whitelisted from './Whitelisted.vue';
  import EthSymbol from './EthSymbol';
  import * as actions from '@/store/actions';
  import Icon from 'vue-awesome/components/Icon';

  export default {
    name: 'dashboard',
    components: {Icon, EthAddress, Whitelisted, EthSymbol},
    computed: {
      ...mapState([
        'paused',
        'account',
        'tokenSymbol',
        'tokenName',
        'tokenBalance',
        'whitelisted',
        'contributions'
      ]),
      ...mapGetters([
        'isOwner'
      ])
    },
    methods: {
      ...mapActions([
        actions.CONTRIBUTE_WEI,
        actions.PAUSE_CONTRACT,
        actions.UNPAUSE_CONTRACT,
      ])
    },
  };
</script>

<style lang="scss" scoped>

</style>
