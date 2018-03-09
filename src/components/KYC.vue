<template>
  <div id="kyc">
    <b-jumbotron header="KYC" lead="Get whitelised and approved to buy">

      <div class="row">
        <div class="col-lg-6">
          <h4>My Account</h4>
          <eth-address :hex="account"></eth-address>
        </div>

        <whitelisted :whitelisted="whitelisted"></whitelisted>

      </div>

    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import EthAddress from './EthAddress.vue';
  import Whitelisted from './Whitelisted.vue';

  export default {
    name: 'kyc',
    components: {EthAddress, Whitelisted},
    computed: {
      ...mapState([
        'account',
        'whitelisted'
      ])
    }
  };

</script>

<style lang="scss" scoped>

</style>
