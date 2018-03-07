module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // - ganache
      network_id: "*", // Match any network id
    },
    testrpc: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
  }
};
