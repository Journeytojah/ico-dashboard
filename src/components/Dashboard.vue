<template>
  <div id="dashboard">

    <b-jumbotron header="Token Generation Event" lead="Building Internet 3.0">
      <p>Generating a new {{ tokenName }} supply</p>

      <div class="row">
        <div class="col-lg-6">
          <b-btn variant="primary" href="#">View whitepaper</b-btn>
        </div>
        <div class="col-lg-6">
          <div class="alert alert-success" role="alert">
            <strong>Buy</strong>  {{ address }}
          </div>
        </div>
      </div>
    </b-jumbotron>

    <h2>So far</h2>

    <b-progress show-value :max="goal" class="mb-3 thermometer" height="50px">
      <b-progress-bar variant="primary" :value="privateSale"></b-progress-bar>
      <b-progress-bar variant="success" :value="preIco"></b-progress-bar>
    </b-progress>

    <div class="row marketing">
      <div class="col-lg-6">
        <h4>Rate</h4>
        <p>{{ rate }} <eth-symbol></eth-symbol> per ABC Token</p>

        <h4>Cap</h4>
        <p>{{ cap }} <eth-symbol></eth-symbol></p>

        <h4>Start</h4>
        <p>{{ start | moment("from") }}</p>
      </div>
      <div class="col-lg-6">
        <h4>Raised</h4>
        <p>{{ raised }} <eth-symbol></eth-symbol></p>

        <h4>Goal</h4>
        <p>{{ goal }} <eth-symbol></eth-symbol></p>

        <h4>End</h4>
        <p>{{ end | moment("from") }}</p>
      </div>
    </div>
  </div>
</template>

<script>

  import { mapGetters, mapState } from 'vuex'
  import Progress from 'bootstrap-vue/es/components/progress/progress'
  import ProgressBar from 'bootstrap-vue/es/components/progress/progress-bar'
  import EthSymbol from './EthSymbol'

  export default {
    name: 'dashboard',
    components: {EthSymbol},
    data () {
      // mock data
      return {
        privateSale: 2504,
        preIco: 1234,
      }
    },
    computed: {
      ...mapState([
        'address',
        'tokenName',
        'rate',
        'raised',
        'token',
        'cap',
        'goal',
        'start',
        'end'
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
