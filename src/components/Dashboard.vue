<template>
  <div id="dashboard">

    <b-jumbotron header="Token Generation Event" lead="Building Internet 3.0">
      <div class="row">
        <div class="col-lg-6">
          <div class="alert alert-success" role="alert">
            <strong>Crowdsale contract address:</strong>
            <eth-address :hex="address"></eth-address>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="alert alert-info" role="alert">
            <strong>Crowdsale <i>Owner</i></strong>
           <eth-address :hex="owner"></eth-address>
          </div>
        </div>
      </div>

      <p class="float-right"><strong>{{ raised }}</strong> <eth-symbol></eth-symbol></p>

      <b-progress show-value :max="cap" class="mb-3 thermometer" height="50px">
        <b-progress-bar variant="primary" :value="raised"></b-progress-bar>
      </b-progress>

    </b-jumbotron>

    <div class="row marketing">
      <div class="col-lg-5">
        <h4>Rate</h4>
        <p>{{ rate }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>

        <h4>Goal</h4>
        <p>
          {{ goal }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Min. Contribution</h4>
        <p>{{ min }} <eth-symbol></eth-symbol></p>

        <h4>Start Date</h4>
        <p>{{ start | moment('from') }}</p>
      </div>
      <div class="col-lg-2">
        &nbsp;
      </div>
      <div class="col-lg-5">
        <h4>Hard Cap</h4>
        <p>
          {{ cap }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Goal Reached</h4>
        <p>
          <icon name="check-circle" v-if="goalReached" scale="2" class="text-success" label="Goal met"></icon>
          <icon name="minus-circle" v-if="!goalReached" scale="2" class="text-muted" label="Goal not met"></icon>
        </p>

        <h4>Max. Contribution</h4>
        <p>{{ max }} <eth-symbol></eth-symbol></p>

        <h4>End Date</h4>
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
        'owner',
        'goalReached'
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
