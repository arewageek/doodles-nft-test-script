require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",

  networks: {
    zircuit: {
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      url: process.env.ZIRCUIT_PROVIDER_URL,
    },
    nexus: {
      url: "https://rpc.nexus.xyz/http",
      chainId: 392,
      accounts: [],
    },
  },
};
