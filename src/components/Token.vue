<template>
  <div id="token">

    <h1>Token name: {{ contractName }}</h1>

    <h2>Symbol: {{ contractSymbol }}</h2>

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
        'contractName',
        'contractSymbol',
      ])
    }
  }
</script>

<style scoped>

</style>
