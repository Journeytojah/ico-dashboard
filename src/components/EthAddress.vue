<template>
  <pre>{{ hex }}</pre>
</template>

<script>

  export default {
    name: 'eth-address',
    props: {
      hex: {
        required: true,
        type: String
      },
    },
  };

</script>

<style lang="scss" scoped>

</style>
