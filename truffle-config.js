const HDWalletProvider = require("@truffle/hdwallet-provider")

module.exports = {
  networks: {
    dev: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 8500000
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "");
      },
      network_id: 4,
      gas: 7000000,
      gasPrice: 100000000000,
      skipDryRun: true,
      timeoutBlocks: 100
    },
    mainnet: {
      provider: function () {
        return new HDWalletProvider({
          mnemonic,
          providerOrUrl: "",
          numberOfAddresses: 10,
        });
      },
      network_id: 1,
      gas: 6721975,
      gasPrice: 50000000000, // 100 gwei
      skipDryRun: true,
      timeoutBlocks: 100
    }
  },
  compilers: {
    solc: {
      version: '0.6.8',
    }
  }
}