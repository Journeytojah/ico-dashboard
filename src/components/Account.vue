<template>
  <div id="account">

    <b-jumbotron :header="tokenName" lead="Account details">
      <div class="row">
        <div class="col-lg-12">
          <h4>Account</h4>
          <eth-address :hex="account"></eth-address>
        </div>
        <div class="col-lg-4">
          <h4>Token Balance</h4>
          <p>{{ tokenBalance }} {{ tokenSymbol }}</p>
        </div>
        <div class="col-lg-4">
          <h4 class="text-center">Whitelisted</h4>
          <p class="text-center">
            <icon name="check" v-if="whitelisted" scale="4" class="text-success"></icon>
            <icon name="times" v-if="!whitelisted" scale="4" class="text-danger"></icon>
          </p>
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
        'account',
        'tokenSymbol',
        'tokenName',
        'tokenBalance',
        'whitelisted'
      ])
    }
  };
</script>

<style lang="scss" scoped>

</style>
