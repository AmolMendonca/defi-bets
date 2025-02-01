import "dotenv/config";
import express from "express";
import { Web3 } from "web3";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(bodyParser.json());


// Web3 setup
const web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);

// Contract setup
// const contractABI = require("../artifacts/contracts/BettingWithInsuranceAndYield.sol/BettingWithInsuranceAndYield.json").abi;

const contractAddress = process.env.CONTRACT_ADDRESS;

// Token contracts setup
// const IERC20_ABI = require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;

// Load ABI files using correct paths

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/Betting.sol/BettingWithInsuranceAndYield.json"), "utf8")
  ).abi;
  
  const IERC20_ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json"), "utf8")
  ).abi;

const depositTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.DEPOSIT_TOKEN_ADDRESS);
const insuranceTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.INSURANCE_TOKEN_ADDRESS);

// Initialize main contract
const bettingContract = new web3.eth.Contract(contractABI, contractAddress);

if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length !== 64) {
    throw new Error("Invalid PRIVATE_KEY: Please check your .env file. It must be exactly 64 characters long and should not include '0x'.");
}

const account = web3.eth.accounts.privateKeyToAccount(
    process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`
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
                chainId: 11155111 // Sepolia chainId
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
        const { participant, amount, insuranceOpted } = req.body;
        const value = toWei(amount);

        if (insuranceOpted) {
            const premium = (Number(value) * 5) / 100; // 5% premium
            
            // app insurance token spending
            const approveTx = insuranceTokenContract.methods.approve(
                contractAddress, 
                premium.toString()
            );
            await signAndSendTransaction(approveTx);
        }

        const tx = bettingContract.methods.createBet(participant, insuranceOpted);
        const receipt = await signAndSendTransaction(tx, value);
        
        res.json({
            success: true,
            betId: receipt.events.BetCreated.returnValues.betId,
            receipt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            insuranceClaimed: bet.insuranceClaimed
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