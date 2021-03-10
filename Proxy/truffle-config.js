const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          `${process.env.MNEMONIC}`,
          `https://rinkeby.infura.io/v3/${process.env.INFURA_APIKEY}`
        );
      },
      network_id: 4,
    },
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_APIKEY,
  },
  plugins: ["truffle-plugin-verify"],
  compilers: {
    solc: {
      version: "0.5.3",
      docker: false,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
