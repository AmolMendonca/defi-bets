require("dotenv").config();
const express = require("express");
const Web3 = require("web3");
const cors = require("cors");
const bodyParser = require("body-parser");

// ============ CONFIGURATION AND SETUP ============

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Web3 setup
const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

// Contract setup
const contractABI = require("../artifacts/contracts/BettingWithInsuranceAndYield.sol/BettingWithInsuranceAndYield.json").abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Token contracts setup
const IERC20_ABI = require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;
const depositTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.DEPOSIT_TOKEN_ADDRESS);
const insuranceTokenContract = new web3.eth.Contract(IERC20_ABI, process.env.INSURANCE_TOKEN_ADDRESS);

// Initialize main contract
const bettingContract = new web3.eth.Contract(contractABI, contractAddress);

// Account setup for transaction signing
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// ============ HELPER FUNCTIONS ============

/**
 * Signs and sends a transaction to the network
 * @param {Object} tx - Web3 transaction object
 * @param {string} value - Amount of ETH to send (in wei)
 * @returns {Promise} Transaction receipt
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

/**
 * Converts ETH amount to Wei
 * @param {string} amount - Amount in ETH
 * @returns {string} Amount in Wei
 */
function toWei(amount) {
    return web3.utils.toWei(amount.toString(), "ether");
}

/**
 * Converts Wei amount to ETH
 * @param {string} amount - Amount in Wei
 * @returns {string} Amount in ETH
 */
function fromWei(amount) {
    return web3.utils.fromWei(amount.toString(), "ether");
}

// ============ API ENDPOINTS ============

/**
 * Create a new bet with optional insurance
 * Required body params:
 * - participant: Ethereum address
 * - amount: Amount in ETH
 * - insuranceOpted: boolean
 */
app.post("/create-bet", async (req, res) => {
    try {
        const { participant, amount, insuranceOpted } = req.body;
        const value = toWei(amount);

        // If insurance is opted, handle insurance premium first
        if (insuranceOpted) {
            const premium = (Number(value) * 5) / 100; // 5% premium
            
            // Approve insurance token spending
            const approveTx = insuranceTokenContract.methods.approve(
                contractAddress, 
                premium.toString()
            );
            await signAndSendTransaction(approveTx);
        }

        // Create bet transaction
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

/**
 * Join an existing bet
 * Required body params:
 * - betId: Bet identifier
 * - amount: Amount in ETH (must match bet amount)
 */
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

/**
 * Confirm winner of a bet
 * Required body params:
 * - betId: Bet identifier
 * - winner: Winner's Ethereum address
 */
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

/**
 * Initiate a dispute for a bet
 * Required body params:
 * - betId: Bet identifier
 */
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

/**
 * Resolve a disputed bet (arbitrator only)
 * Required body params:
 * - betId: Bet identifier
 * - winner: Winner's Ethereum address
 */
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

/**
 * Claim insurance for a bet
 * Required body params:
 * - betId: Bet identifier
 */
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

/**
 * Cancel a bet (creator only, after 24 hours)
 * Required body params:
 * - betId: Bet identifier
 */
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

/**
 * Get detailed information about a bet
 * Required params:
 * - betId: Bet identifier
 */
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});