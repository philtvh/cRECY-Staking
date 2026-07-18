import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const API_KEY = process.env.ETHERSCAN_API_KEY || process.env.CELOSCAN_API_KEY;

if (!PRIVATE_KEY) {
  console.warn("⚠️  WARNING: No PRIVATE_KEY found in .env file! Deployment will fail.");
}

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    celo: {
      url: "https://forno.celo.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42220
    },
    alfajores: { 
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 44787
    }
  },
  // Mutes the terminal warning
  sourcify: {
    enabled: false
  },
  etherscan: {
    // V3 Native Mode: Just a single string
    apiKey: API_KEY || "YOUR_ETHERSCAN_API_KEY"
  }
};