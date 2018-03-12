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
    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import EthAddress from './EthAddress.vue';
  import Whitelisted from './Whitelisted.vue';
  import EthSymbol from './EthSymbol';

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
    }
  };
</script>

<style lang="scss" scoped>

</style>
