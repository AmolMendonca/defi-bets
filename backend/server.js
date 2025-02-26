import "dotenv/config";
import express from "express";
import { Web3 } from "web3";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import createBetRoute from "./routes/create_bets.js";
import joinBetRoute from "./routes/join_bets.js";
import login from "./routes/login.js";
import session from "express-session";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(
  session({
    secret: "hackathon-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);


const MONGO_URI = process.env.MONGO_URI;


mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use("/api", createBetRoute);
app.use("/api", joinBetRoute);
app.use("/api", login);

// Web3 setup
const web3 = new Web3(
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);

// Contract setup
// const contractABI = require("../artifacts/contracts/BettingWithInsuranceAndYield.sol/BettingWithInsuranceAndYield.json").abi;

const contractAddress = process.env.CONTRACT_ADDRESS;

// Token contracts setup
// const IERC20_ABI = require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;

// Load ABI files using correct paths

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractABI = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "../artifacts/contracts/Betting.sol/BettingWithInsuranceAndYield.json"
    ),
    "utf8"
  )
).abi;

const IERC20_ABI = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json"
    ),
    "utf8"
  )
).abi;

const depositTokenContract = new web3.eth.Contract(
  IERC20_ABI,
  process.env.DEPOSIT_TOKEN_ADDRESS
);
const insuranceTokenContract = new web3.eth.Contract(
  IERC20_ABI,
  process.env.INSURANCE_TOKEN_ADDRESS
);

// Initialize main contract
const bettingContract = new web3.eth.Contract(contractABI, contractAddress);

if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length !== 64) {
  throw new Error(
    "Invalid PRIVATE_KEY: Please check your .env file. It must be exactly 64 characters long and should not include '0x'."
  );
}

const account = web3.eth.accounts.privateKeyToAccount(
  process.env.PRIVATE_KEY.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`
);

// Account setup for transaction signing
web3.eth.accounts.wallet.add(account);

/**
 Signs and sends a transaction to the network
 Web3 transaction object
 Amount of ETH to send (in wei)
 Transaction receipt
 */
async function signAndSendTransaction(tx, value = "0") {
  try {
    const gas = await tx.estimateGas({ from: account.address, value });
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(account.address);
    const data = tx.encodeABI();

    const signedTx = await web3.eth.accounts.signTransaction(
      {
        to: contractAddress,
        data,
        gas,
        gasPrice,
        value,
        nonce,
        chainId: 11155111, // Sepolia chainId
      },
      process.env.PRIVATE_KEY
    );

    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  } catch (error) {
    console.error("Transaction error:", error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
}

function toWei(amount) {
  return web3.utils.toWei(amount.toString(), "ether");
}

function fromWei(amount) {
  return web3.utils.fromWei(amount.toString(), "ether");
}

// api type shi

/**
create a new bet with optional insurance
reqs for this:
participant: eth address
amount: Amount in ETH
insuranceOpted: y/n (not the other kinda yn)
 */

app.post("/create-bet", async (req, res) => {
  try {
    const { bet_title, bet_terms, creator, amount, owner_insurance_opted, created_at } = req.body;

    // Access the underlying MongoDB driver
    const db = mongoose.connection.db;
    const betsCollection = db.collection("bets");

    // Insert the bet as a simple object
    const result = await betsCollection.insertOne({
      bet_title,
      bet_terms,
      creator,
      amount,
      owner_insurance_opted,
      created_at,
    });

    res.json({
      success: true,
      message: "Bet created in DB (no contract call).",
      bet: result.ops[0], // result.ops is the array of inserted documents
    });
  } catch (error) {
    console.error("Error creating bet:", error);
    res.status(500).json({ error: "Failed to create bet" });
  }
});

app.post("/join-bet", async (req, res) => {
  try {
    const { betId, amount } = req.body;
    const value = toWei(amount);

    const tx = bettingContract.methods.joinBet(betId);
    const receipt = await signAndSendTransaction(tx, value);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/confirm-winner", async (req, res) => {
  try {
    const { betId, winner } = req.body;
    const tx = bettingContract.methods.confirmWinner(betId, winner);
    const receipt = await signAndSendTransaction(tx);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/dispute-bet", async (req, res) => {
  try {
    const { betId } = req.body;
    const tx = bettingContract.methods.disputeBet(betId);
    const receipt = await signAndSendTransaction(tx);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/resolve-dispute", async (req, res) => {
  try {
    const { betId, winner } = req.body;
    const tx = bettingContract.methods.resolveDispute(betId, winner);
    const receipt = await signAndSendTransaction(tx);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/claim-insurance", async (req, res) => {
  try {
    const { betId } = req.body;
    const tx = bettingContract.methods.claimInsurance(betId);
    const receipt = await signAndSendTransaction(tx);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/cancel-bet", async (req, res) => {
  try {
    const { betId } = req.body;
    const tx = bettingContract.methods.cancelBet(betId);
    const receipt = await signAndSendTransaction(tx);

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/bet/:betId", async (req, res) => {
  try {
    const betId = req.params.betId;
    const bet = await bettingContract.methods.bets(betId).call();

    // Format the response
    const formattedBet = {
      id: betId,
      creator: bet.creator,
      participant: bet.participant,
      amount: fromWei(bet.amount),
      resolved: bet.resolved,
      winner: bet.winner,
      createdAt: new Date(bet.createdAt * 1000).toISOString(),
      disputed: bet.disputed,
      creatorConfirmed: bet.creatorConfirmed,
      participantConfirmed: bet.participantConfirmed,
      insuranceOpted: bet.insuranceOpted,
      insuranceClaimed: bet.insuranceClaimed,
    };

    res.json(formattedBet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bets", async (req, res) => {
  try {
    // Access the raw MongoDB driver via mongoose.connection.db
    const db = mongoose.connection.db;

    // Grab the "bets" collection
    const betsCollection = db.collection("bets");

    // Retrieve all documents in the "bets" collection
    const bets = await betsCollection.find({}).toArray();

    console.log(bets)

    // Return them as JSON
    res.json(bets);
  } catch (error) {
    console.error("Error retrieving bets:", error);
    res.status(500).json({ error: "Unable to retrieve bets" });
  }
});


app.get("/bet/:betId", async (req, res) => {
  try {
    const betId = req.params.betId;
    const bet = await bettingContract.methods.bets(betId).call();

    // Format the response
    const formattedBet = {
      id: betId,
      creator: bet.creator,
      participant: bet.participant,
      amount: fromWei(bet.amount),
      resolved: bet.resolved,
      winner: bet.winner,
      createdAt: new Date(bet.createdAt * 1000).toISOString(),
      disputed: bet.disputed,
      creatorConfirmed: bet.creatorConfirmed,
      participantConfirmed: bet.participantConfirmed,
      insuranceOpted: bet.insuranceOpted,
      insuranceClaimed: bet.insuranceClaimed,
    };

    res.json(formattedBet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
