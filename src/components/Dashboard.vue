<template>
  <div id="dashboard">
      <b-jumbotron header="Bootstrap Vue" lead="Bootstrap 4 Components for Vue.js 2" >
        <p>For more information visit website</p>
        <b-btn variant="primary" href="#">More Info</b-btn>
      </b-jumbotron>

      <div class="row marketing">
        <div class="col-lg-6">
          <h4>Rate</h4>
          <p>{{ rate }}</p>

          <h4>Raised</h4>
          <p>{{ weiRaised }}</p>

          <h4>Subheading</h4>
          <p>Maecenas sed diam eget risus varius blandit sit amet non magna.</p>
        </div>
        <div class="col-lg-6">
          <h4>Rate</h4>
          <p>{{ rate }}</p>

          <h4>Raised</h4>
          <p>{{ weiRaised }}</p>

          <h4>Subheading</h4>
          <p>Maecenas sed diam eget risus varius blandit sit amet non magna.</p>
        </div>
      </div>
  </div>
</template>

<script>

  /* global web3:true */
  import {mapGetters, mapState} from 'vuex'
  import Jumbotron from 'bootstrap-vue/es/components/jumbotron/jumbotron'

  export default {
    name: 'dashboard',
    components: {Jumbotron},
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
