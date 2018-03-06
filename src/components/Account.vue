<template>
  <div id="account">

    <b-jumbotron header="ABC Account" lead="Building ABC for Internet 3.0">
      <div class="row">
        <div class="col-lg-6">
          <h4>Account</h4>
          <p>{{ account }}</p>
        </div>
        <div class="col-lg-6">
          <h4>Balance</h4>
          <p></p>
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
        'account'
      ])
    }
  }
</script>

<style lang="scss" scoped>

</style>
