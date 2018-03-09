<template>
  <div class="col-lg-6">
    <h4 class="text-center">Whitelisted</h4>
    <p class="text-center">
      <icon name="check" v-if="whitelisted" scale="4" class="text-success"></icon>
      <icon name="times" v-if="!whitelisted" scale="4" class="text-danger"></icon>
    </p>
  </div>
</template>

<script>

  export default {
    name: 'whitelisted',
    props: {
      whitelisted: {
        required: false,
        type: Boolean
      },
    },
  };
</script>

<style lang="scss" scoped>

</style>
