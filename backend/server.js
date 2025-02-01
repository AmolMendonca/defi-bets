import "dotenv/config"; // Load environment variables
import express from "express";
import { Web3 } from "web3"; // Import Web3 from web3.js v4.x
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Web3 setup
if (!process.env.ALCHEMY_API_KEY) {
    throw new Error("ALCHEMY_API_KEY is not defined in .env file");
}

const web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);

// Contract setup
const contractABI = (await import("../artifacts/contracts/Betting.sol/BettingWithInsuranceAndYield.json", {
    assert: { type: "json" },
  })).default.abi;
  
  const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not defined in .env file");
}

// Token contracts setup
const IERC20_ABI = (await import("@openzeppelin/contracts/build/contracts/IERC20.json", {
    assert: { type: "json" },
  })).default.abi;
  
const depositTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.DEPOSIT_TOKEN_ADDRESS);
const insuranceTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.INSURANCE_TOKEN_ADDRESS);

// Initialize main contract
const bettingContract = new web3.eth.Contract(contractABI, contractAddress);

// Account setup for transaction signing
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Example route
app.get("/", (req, res) => {
    res.send("Server is running!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});