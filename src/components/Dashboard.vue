<template>
  <div id="dashboard">

    <div id="splash">
      <h1>{{ title }}</h1>

      <ul>
        <li>Rate: {{ rate }}</li>
        <li>Raised: {{ weiRaised }}</li>
      </ul>
    </div>

  </div>
</template>

<script>

  /* global web3:true */
  import {mapGetters, mapState} from 'vuex'

  export default {
    name: 'dashboard',
    components: {},
    data() {
      return {
        title: 'Ico Sample Crowdfunding',
      }
    },
    computed: {
      ...mapState([
        'rate',
        'weiRaised',
        'token'
      ])
    }
  }
</script>

<style lang="scss" scoped>

</style>
