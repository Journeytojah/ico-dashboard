<template>
  <div id="dashboard">

    <b-jumbotron header="Token Generation Event" lead="Building Internet 3.0">
      <div class="row">
        <div class="col-lg-6">
          <h4>Owner</h4>
          <eth-address :hex="owner"></eth-address>
        </div>
        <div class="col-lg-6">
          <div class="alert alert-success" role="alert">
            <strong>Crowdsale contract address:</strong>
            <eth-address :hex="address"></eth-address>
          </div>
        </div>
      </div>

      <h2 class="text-muted">{{ icoState }}</h2>

      <p class="float-right"><strong>{{ raised }}</strong>
        <eth-symbol></eth-symbol>
      </p>

      <b-progress show-value :max="cap" class="mb-3 thermometer" height="50px">
        <b-progress-bar variant="primary" :value="raised"></b-progress-bar>
      </b-progress>

    </b-jumbotron>

    <div class="row marketing">
      <div class="col-lg-5">
        <h4>Rate</h4>
        <p>
          {{ rate }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>

        <h4>Goal</h4>
        <p>
          {{ goalHuman }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Min. Contribution</h4>
        <p>{{ minHuman }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Start Date</h4>
        <p>{{ start | moment('from') }}</p>

        <h4>Private Sale Close Date</h4>
        <p>{{ privateSaleCloseTime | moment('from') }}</p>

        <h4>Pre-ICO Sale Close Date</h4>
        <p>{{ preSaleCloseTime | moment('from') }}</p>

        <h4>Paused?</h4>
        <p>{{ paused }}</p>
      </div>
      <div class="col-lg-2">
        &nbsp;
      </div>
      <div class="col-lg-5">
        <h4>Hard Cap</h4>
        <p>
          {{ capHuman }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Goal Reached</h4>
        <p>
          <span v-if="!goalReached">No</span>
          <span v-if="goalReached">Yes</span>
          <icon name="check-circle" v-if="goalReached" scale="1" class="text-success" label="Goal met"></icon>
        </p>

        <h4>Max. Contribution</h4>
        <p>{{ maxHuman }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>End Date</h4>
        <p>{{ end | moment('from') }}</p>

        <h4>Private Sale Rate</h4>
        <p>
          {{ privateSaleRate }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>

        <h4>Pre-ICO Sale Rate</h4>
        <p>
          {{ preSaleRate }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>
      </div>
    </div>

  </div>
</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import Progress from 'bootstrap-vue/es/components/progress/progress';
  import ProgressBar from 'bootstrap-vue/es/components/progress/progress-bar';
  import EthSymbol from './EthSymbol';
  import EthAddress from './EthAddress.vue';

  export default {
    name: 'dashboard',
    components: {EthSymbol, EthAddress},
    computed: {
      ...mapState([
        'address',
        'tokenName',
        'rate',
        'raised',
        'token',
        'cap',
        'capHuman',
        'goal',
        'goalHuman',
        'start',
        'end',
        'tokenSymbol',
        'min',
        'minHuman',
        'max',
        'maxHuman',
        'start',
        'end',
        'owner',
        'goalReached',
        'privateSaleCloseTime',
        'privateSaleRate',
        'preSaleCloseTime',
        'preSaleRate',
        'paused'
      ]),
      ...mapGetters(['icoState'])
    }
  };
</script>

<style lang="scss" scoped>
  .thermometer {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
