<template>
  <div class="current-network">
    <v-alert type="info" :value="true">
      Current Network: {{ currentNetwork }}
    </v-alert>
  </div>
</template>

<script>
  /* global web3:true */

  import {mapState} from 'vuex';

  export default {
    name: 'currentNetwork',
    computed: {
      ...mapState(['currentNetwork']),
    },
  };
</script>

<style lang="scss" scoped>
  .current-network {
    font-size: 12px;
  }

</style>
