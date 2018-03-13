<template>
  <div id="vault">

    <b-jumbotron header="Vault" lead="All about our vault (where funds are held in escrow)">

      <div class="row">
        <div class="col-lg-12">
          <h4>Vault Address</h4>
          <eth-address :hex="vault"></eth-address>
        </div>
      </div>

    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import EthAddress from './EthAddress.vue';

  export default {
    name: 'vault',
    components: {EthAddress},
    data() {
      return {
        title: 'Hello',
      };
    },
    computed: {
      ...mapState([
        'vault'
      ])
    }
  };
</script>

<style lang="scss" scoped>

</style>
