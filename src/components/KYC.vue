<template>
  <div id="kyc">
    <b-jumbotron header="KYC" lead="Get whitelised and approved to buy">

      <div class="row">
        <div class="col-lg-6">
          <h4>My Account</h4>
          <eth-address :hex="account"></eth-address>
        </div>

        <whitelisted :whitelisted="whitelisted" v-if="whitelisted != null"></whitelisted>
      </div>

      <div class="row justify-content-lg-center" v-if="!whitelisted && !submitted">
        <div class="col-lg-6">
          <h2>Complete KYC</h2>

          <b-form @submit="onSubmit" novalidate>
            <b-form-group id="myAccount"
                          label=""
                          label-for="myAccount"
                          description="For example: 0xdf83C05dc7a2aaC6826Ef0Fb79CB2A768F0b1053.">
              <b-form-input id="myAccount"
                            type="text"
                            v-model="form.myAccount"
                            required
                            placeholder="Ethereum address">
              </b-form-input>
            </b-form-group>

            <b-form-group id="tandcs">
              <b-form-checkbox-group v-model="form.checked" id="exampleChecks">
                <b-form-checkbox value="true">I am a sane person</b-form-checkbox>
              </b-form-checkbox-group>
            </b-form-group>

            <b-button type="submit" variant="primary">Submit</b-button>
          </b-form>

        </div>
      </div>

      <div class="row justify-content-lg-center" v-if="!whitelisted && submitted">
        <div class="col-lg-6">
          <h2>Complete KYC</h2>

          <div class="alert alert-info" role="alert">
            <strong>KYC Submitted</strong> We will review your submission...
          </div>
        </div>
      </div>

    </b-jumbotron>

  </div>
</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import EthAddress from './EthAddress.vue';
  import Whitelisted from './Whitelisted.vue';
  import Web3 from 'web3';

  export default {
    name: 'kyc',
    components: {EthAddress, Whitelisted},
    data () {
      return {
        form: {
          myAccount: '',
          checked: 'false'
        },
        submitted: false
      };
    },
    methods: {
      onSubmit (evt) {
        evt.preventDefault();

        // check is validate form data
        this.submitted = Web3.utils.isAddress(this.form.myAccount) && (this.form.checked === 'true');
      }
    },
    computed: {
      ...mapState([
        'account',
        'whitelisted'
      ])
    }
  };

</script>

<style lang="scss" scoped>

</style>
