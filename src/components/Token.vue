<template>
  <div id="token">

    <b-jumbotron :header="tokenName" lead="All about our token">

      <div class="row">
        <div class="col-lg-12">
          <h4>Address</h4>
          <eth-address :hex="tokenAddress"></eth-address>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-4">
          <h4>Token Name</h4>
          <p>{{ tokenName }}</p>
        </div>
        <div class="col-lg-4">
        </div>
        <div class="col-lg-4">
          <h4>Supply</h4>
          <p>{{ tokenTotalSupply }} {{ tokenSymbol }}</p>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-4">
          <h4>Symbol</h4>
          <p>{{ tokenSymbol }}</p>
        </div>
        <div class="col-lg-4">
        </div>
        <div class="col-lg-4">
          <h4>Crowdsale Balance</h4>
          <p>{{ crowdsaleBalance }} {{ tokenSymbol }}</p>
        </div>
      </div>

    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import EthAddress from './EthAddress.vue';

  export default {
    name: 'dashboard',
    components: {EthAddress},
    data() {
      return {
        title: 'Hello',
      };
    },
    computed: {
      ...mapState([
        'tokenName',
        'tokenSymbol',
        'tokenAddress',
        'tokenTotalSupply',
        'crowdsaleBalance'
      ])
    }
  };
</script>

<style lang="scss" scoped>

</style>
