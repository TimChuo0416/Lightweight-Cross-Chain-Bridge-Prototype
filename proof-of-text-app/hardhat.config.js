require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // 本地測試網路
    localhost: {
      url: "http://127.0.0.1:8545",
      // chainId: 31337 // Hardhat Network's chain ID
    },
    // Sepolia 測試網路設定
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // 從 .env 讀取 RPC URL
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [], // 從 .env 讀取私鑰
      // chainId: 11155111 // Sepolia's chain ID
    }
  }
};
