<template>
  <div id="dashboard">

    <b-jumbotron header="Token Generation Event" lead="Building Internet 3.0">
      <div class="row">
        <div class="col-lg-6">
          <b-btn variant="secondary" href="#">View whitepaper</b-btn>
        </div>
        <div class="col-lg-6">
          <div class="alert alert-success" role="alert">
            <strong>Crowdsale contract address:</strong>
            <eth-address :hex="address"></eth-address>
          </div>
        </div>
      </div>

      <p class="float-right"><strong>{{ raised }}</strong> <eth-symbol></eth-symbol></p>
      <b-progress show-value :max="cap" class="mb-3 thermometer" height="50px">
        <b-progress-bar variant="primary" :value="raised"></b-progress-bar>
      </b-progress>

    </b-jumbotron>

    <div class="row marketing">
      <div class="col-lg-6">
        <h4>Rate</h4>
        <p>{{ rate }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>

        <h4>Owner</h4>
        <p class="small"><eth-address :hex="owner"></eth-address></p>

        <h4>Min</h4>
        <p>{{ min }} <eth-symbol></eth-symbol></p>

        <h4>Start</h4>
        <p>{{ start | moment('from') }}</p>
      </div>
      <div class="col-lg-6">
        <h4>Hard Cap</h4>
        <p>{{ cap }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Raised</h4>
        <p>{{ raised }}</p>

        <h4>Max</h4>
        <p>{{ max }} <eth-symbol></eth-symbol></p>

        <h4>End</h4>
        <p>{{ end | moment('from') }}</p>
      </div>
    </div>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import Progress from 'bootstrap-vue/es/components/progress/progress';
  import ProgressBar from 'bootstrap-vue/es/components/progress/progress-bar';
  import EthSymbol from './EthSymbol';
  import EthAddress from './EthAddress.vue';

  export default {
    name: 'dashboard',
    components: {EthSymbol, EthAddress},
    data () {
      return {};
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
        'end',
        'tokenSymbol',
        'min',
        'max',
        'start',
        'end',
        'owner'
      ])
    }
  };
</script>

<style lang="scss" scoped>
  .thermometer {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
