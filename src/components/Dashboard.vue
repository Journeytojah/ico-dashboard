<template>
  <div id="dashboard">

    <b-jumbotron header="ABC Token Generation Event" lead="Building ABC for Internet 3.0">
      <b-btn variant="primary" href="#">View whitepaper</b-btn>
    </b-jumbotron>

    <h2>Total raised:</h2>

    <b-progress show-value :max="max" class="mb-3 thermometer" height="50px">
      <b-progress-bar variant="primary" :value="values[0]"></b-progress-bar>
      <b-progress-bar variant="success" :value="values[1]"></b-progress-bar>
      <b-progress-bar variant="info" :value="values[2]"></b-progress-bar>
    </b-progress>

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
  import { mapGetters, mapState } from 'vuex'
  import Jumbotron from 'bootstrap-vue/es/components/jumbotron/jumbotron'
  import Progress from 'bootstrap-vue/es/components/progress/progress'
  import ProgressBar from 'bootstrap-vue/es/components/progress/progress-bar'

  export default {
    name: 'dashboard',
    components: {Jumbotron},
    data () {
      return {
        max: 100,
        values: [15, 30, 20]
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
  .thermometer {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
