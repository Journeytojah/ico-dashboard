<template>
  <div id="account">

    <b-jumbotron :header="tokenName" lead="Account details">
      <div class="row">
        <div class="col-lg-12">
          <h4>Account</h4>
          <p>{{ account }}</p>
        </div>
        <div class="col-lg-4">
          <h4>Token Balance</h4>
          <p>{{ tokenBalance }} {{ tokenSymbol }}</p>
        </div>
      </div>
    </b-jumbotron>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex'

  export default {
    name: 'dashboard',
    components: {},
    data() {
      return {
        title: 'Hello',
      }
    },
    computed: {
      ...mapState([
        'account',
        'tokenSymbol',
        'tokenName',
        'tokenBalance'
      ])
    }
  }
</script>

<style lang="scss" scoped>

</style>
