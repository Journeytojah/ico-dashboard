<template>
  <div id="account">

    <h1>{{ account }}</h1>

    <p>My balance: </p>

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
        'account'
      ])
    }
  }
</script>

<style lang="scss" scoped>

</style>
