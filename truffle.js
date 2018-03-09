module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    testrpc: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    }
  }
};
