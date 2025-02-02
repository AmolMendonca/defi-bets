require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ALCHEMY_URLALCHEMY_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;


module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: ALCHEMY_URLALCHEMY_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
