import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      accounts: PRIVATE_KEY ? [{ privateKey: PRIVATE_KEY, balance: "10000000000000000000000" }] : undefined,
      chainId: 31337
    },
    localhost: {
      url: "http://0.0.0.0:8545", // Changé de 127.0.0.1 à 0.0.0.0
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
    },
  },
};

export default config;
