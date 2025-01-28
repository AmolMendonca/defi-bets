require("dotenv").config();
const express = require("express");
const Web3 = require("web3");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const contractABI = require("../artifacts/contracts/Betting.sol/Betting.json").abi; 

/* for rob and vik, abi is basically a standardized way for a smart contract to interact / interface with a backend. it defines
what functions are available, how to call them, their names, parameters etc. respect the interface ahh explanation
*/

const contractAddress = process.env.CONTRACT_ADDRESS;

const bettingContract = new web3.eth.Contract(contractABI, contractAddress);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY); // to sign a transaction
web3.eth.accounts.wallet.add(account);

/* how to build this

user calls api
convert eth amount to wei
create transaction obj
estimate gas in wei
sign with your metamask key
broadcast transaction
validate msg.value > 0, participant != creator,
create bet and store in mapping
mine transaction
verify on sepolia etherscan

*/

app.post("/create-bet", async (req, res) => {
    try {
        const { participant, amount } = req.body;
        const value = web3.utils.toWei(amount, "ether");

        const tx = bettingContract.methods.createBet(participant);
        const gas = await tx.estimateGas({ from: account.address, value }); // estimating gas to ensure ur not too broke for ts
        const data = tx.encodeABI(); // createBet(participant) turns into hexadecimal string type shi
        
        const nonce = await web3.eth.getTransactionCount(account.address); // nonce = number of transactions, prevents double spending

        const signedTx = await web3.eth.accounts.signTransaction(
            { to: contractAddress, 
                data, 
                gas, 
                value, 
                nonce, // checks order
                chainId: 11155111 // sepolia id
            },
            process.env.PRIVATE_KEY
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        res.json({ success: true, receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/join-bet", async (req, res) => {
    try {
        const { betId, amount } = req.body;
        const value = web3.utils.toWei(amount, "ether");

        const tx = bettingContract.methods.joinBet(betId);
        const gas = await tx.estimateGas({ from: account.address, value });
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(account.address);

        const signedTx = await web3.eth.accounts.signTransaction(
            { to: contractAddress, data, gas, value, nonce, chainId: 11155111 },
            process.env.PRIVATE_KEY
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction); // sends this to sepolia testnet with transaction hash, block number, gas used

        res.json({ success: true, receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/confirm-winner", async (req, res) => {
    try {
        const { betId, winner } = req.body;

        const tx = bettingContract.methods.confirmWinner(betId, winner);
        const gas = await tx.estimateGas({ from: account.address });
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(account.address);

        const signedTx = await web3.eth.accounts.signTransaction(
            { to: contractAddress, data, gas, nonce, chainId: 11155111 },
            process.env.PRIVATE_KEY
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        res.json({ success: true, receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* 
frontend sends get
backend extracts betID
call smart contract
contract returns bet data
backend sends response to client
*/

app.get("/bet/:betId", async (req, res) => {
    try {
        const betId = req.params.betId;
        const bet = await bettingContract.methods.bets(betId).call(); // accesses bet mapping without gas because calls are free (no ether)
        res.json(bet); // returns bet as json obj
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`We up on on http://localhost:${PORT} fr`);
});
