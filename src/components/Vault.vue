<template>
  <div id="vault">

    <b-jumbotron header="Vault" lead="All about our vault (where funds are held in escrow)">

      <div class="row">
        <div class="col-lg-12">
          <h4>Vault Address</h4>
          <eth-address :hex="vault"></eth-address>
        </div>

        <div class="col-lg-4">
          <h4>Vault Balance</h4>
          <p>{{ vaultBalance }} <eth-symbol></eth-symbol></p>
        </div>

        <div class="col-lg-4">
          <h4>Vault State</h4>
          <p><span class="text-muted">TODO</span></p>
        </div>
      </div>

    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import EthAddress from './EthAddress.vue';
  import EthSymbol from './EthSymbol';

  export default {
    name: 'vault',
    components: {EthAddress, EthSymbol},
    computed: {
      ...mapState([
        'vault',
        'vaultBalance',
        'vaultState'
      ])
    }
  };
</script>

<style lang="scss" scoped>

</style>
