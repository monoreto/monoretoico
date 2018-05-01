require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"// , // Match any network id
    },
    coverage: {
      host: "127.0.0.1",
      port: 8555,
      network_id: "*", // Match any network id
      gasPrice: 0x01,
    },
    rinkeby: {
      host: "127.0.0.1",
      port: 8547,
      from: "0x6E09f0F026483f54928995D6fbb2AC4E6F24E12C",
      network_id: 4,
      gas: 4612388
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
