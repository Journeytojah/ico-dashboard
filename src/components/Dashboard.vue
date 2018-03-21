<template>
  <div id="dashboard">
    <v-card>
    <v-card-title light>
      <h2>Token Generation Event</h2>
    </v-card-title>
    </v-card>


      <v-container fluid grid-list-sm>
        <v-layout row>
          <v-card color="grey lighten-3">
          <v-flex xs12 align-end>
                <h4 class="black--text">Contract address:</h4>
          </v-flex>
          <v-flex xs12 align-end>
                <v-chip label>
                  <v-icon left>receipt</v-icon><eth-address :hex="address"></eth-address>
                </v-chip>
          </v-flex>
          </v-card>


            <v-card color="grey lighten-3">
              <v-flex xs12 align-end>
                <h4 class="black--text">Owner:</h4>
              </v-flex>
              <v-flex xs12 align-end>
                <v-chip label>
                  <v-icon left>lock</v-icon><eth-address :hex="owner"></eth-address>
                </v-chip>
              </v-flex>
            </v-card>
        </v-layout>

        <v-layout row>
          <v-flex xs4 >
            <v-card tile flat color="grey lighten-3">
              <v-card-text>
              <div class="black--text">Amount raised: {{ raised }}</div><eth-symbol></eth-symbol>
              </v-card-text>
            </v-card>
          </v-flex>
          <v-flex xs4>
            <v-card tile flat color="red lighten-2">
              <v-card-text>#2</v-card-text>
            </v-card>
          </v-flex>
          <v-flex xs4>
            <v-card tile flat color="red darken-1">
              <v-card-text>#3</v-card-text>
            </v-card>
          </v-flex>
        </v-layout>





        <v-layout row wrap>
          <v-flex xs12 sm6 md3 order-md4 order-sm2>
            <v-card dark tile flat color="red darken-2">
            </v-card>
          </v-flex>
          <v-flex xs12 sm6 md3 order-md3 order-sm1>
            <v-card dark tile flat color="deep-orange lighten-1">
              <v-card-text>#2</v-card-text>
            </v-card>
          </v-flex>
          <v-flex xs12 sm6 md3 order-md2 order-sm4>
            <v-card dark tile flat color="deep-orange darken-3">
              <v-card-text>#3</v-card-text>
            </v-card>
          </v-flex>
          <v-flex xs12 sm6 md3 order-md1 order-sm3>
            <v-card dark tile flat color="deep-orange">
              <v-card-text>#4</v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>






    <!--<b-jumbotron header="Token Generation Event" lead="Building Internet 3.0">-->
      <!--<div class="row">-->
        <!--<div class="col-lg-6">-->
          <!--<h4>Owner</h4>-->

        <!--</div>-->
        <!--<div class="col-lg-6">-->
          <!--<div class="alert alert-success" role="alert">-->
            <!--<strong>Crowdsale contract address:</strong>-->
            <!--<eth-address :hex="address"></eth-address>-->
          <!--</div>-->
        <!--</div>-->
      <!--</div>-->

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
        <p>{{ min }}
          <eth-symbol></eth-symbol>
        </p>

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
          <span v-if="!goalReached">No</span>
          <span v-if="goalReached">Yes</span>
          <icon name="check-circle" v-if="goalReached" scale="1" class="text-success" label="Goal met"></icon>
        </p>

        <h4>Max. Contribution</h4>
        <p>{{ max }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>End Date</h4>
        <p>{{ end | moment('from') }}</p>
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
