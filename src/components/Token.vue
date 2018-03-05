<template>
  <div id="token">

    <h1>Token name: {{ tokenName }}</h1>

    <h2>Symbol: {{ tokenSymbol }}</h2>

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

<style scoped>

</style>
