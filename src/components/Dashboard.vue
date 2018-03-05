<template>
  <div id="dashboard">

    <div id="splash">
      <h1>{{ title }}</h1>
      <p>Our token:</p>
    </div>

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
      ])
    }
  }
</script>

<style scoped>

</style>
