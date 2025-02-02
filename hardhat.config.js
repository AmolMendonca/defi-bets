require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ALCHEMY_URLALCHEMY_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;


module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      debug: {
        revertStrings: "debug"
      }
    }
  },
  networks: {
    sepolia: {
      url: ALCHEMY_URLALCHEMY_URL,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      gas: 12000000,
      blockGasLimit: 12000000
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
