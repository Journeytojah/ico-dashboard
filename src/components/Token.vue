<template>
  <div id="token">

    <b-jumbotron header="ABC Token" lead="Building ABC for Internet 3.0">
      <div class="row">
        <div class="col-lg-6">
          <h4>Token name</h4>
          <p>{{ tokenName }}</p>
        </div>
        <div class="col-lg-6">
          <h4>Symbol</h4>
          <p>{{ tokenSymbol }}</p>
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
        'tokenName',
        'tokenSymbol',
      ])
    }
  }
</script>

<style lang="scss" scoped>

</style>
