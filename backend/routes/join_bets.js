// routes/create_bet.js
import express from 'express';
import mongoose from 'mongoose';
import "dotenv/config";
import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contractPath = new URL('../../artifacts/contracts/Betting.sol/BettingWithInsuranceAndYield.json', import.meta.url);
const BettingContract = JSON.parse(
  await readFile(contractPath, 'utf8')
);

const router = express.Router();
const Bet = mongoose.models.Bet;


const provider = new JsonRpcProvider(process.env.ALCHEMY_URL);
const bettingContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    BettingContract.abi,
    provider
);

console.log(BettingContract.abi);
router.post("/join-bet", async (req, res) => {
  try {
    const { betid, participant_insurance_opted } = req.body;

    // Get creator from session
    // const participant = "0x76AA40cBBf4ca79d1558745800531a2c8f66507e";
    const participant = req.session.walletAddress;
    console.log("this is the participant id:", participant)
    if (!participant) {
      return res.status(401).json({ error: "No wallet connected" });
    }

    const allBets = await Bet.find({});
    console.log("🔥 All Bets in 'test.bets':", allBets);

    // const betObjectId = new mongoose.Types.ObjectId(betid);
    let betObjectId;
    try {
      betObjectId = new mongoose.Types.ObjectId(betid);
    } catch (error) {
      return res.status(400).json({ error: "Invalid Bet ID format" });
    }

    const existingBet = await Bet.findOne({ bet_id: betObjectId });
    console.log("Existing Bet:", existingBet);

    if (!existingBet) {
    return res.status(404).json({ error: "Bet not found" });
    }

    const updatedBet = await Bet.findOneAndUpdate(
    { bet_id: betObjectId, participant: "TBD" }, // Ensure no one has joined before
    { 
        participant,
        participant_insurance_opted
    },
    { new: true } // Return the updated document
    );

    if (!updatedBet) {
    return res.status(404).json({ error: "Bet not found or already joined" });
    }

    const amountInWei = ethers.parseEther(existingBet.amount.toString());

    const creatorSigner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const createBetTx = await bettingContract.connect(creatorSigner).createBet(
            participant, // Now we have the actual participant address
            existingBet.owner_insurance_opted,
            participant_insurance_opted,
            { value: amountInWei }
        );
    const createReceipt = await createBetTx.wait();
    const betCreatedEvent = createReceipt.events.find(e => e.event === 'BetCreated');
    const onChainBetId = betCreatedEvent.args.betId;

    const participantSigner = new ethers.Wallet(process.env.PART_PRIVATE_KEY, provider);
    const joinBetTx = await bettingContract.connect(participantSigner).joinBet(
        onChainBetId,
        { value: amountInWei }
    );
    await joinBetTx.wait();

    const updatedBetagain = await Bet.findOneAndUpdate(
        { bet_id: betObjectId },
        {
            participant: participant,
            participant_insurance_opted: participant_insurance_opted,
            on_chain_bet_id: onChainBetId
        },
        { new: true }
    );

    res.json({
    success: true,
    message: "Bet joined successfully",
    bet: updatedBetagain,
    onChainBetId: onChainBetId
    });

} catch (error) {
    res.status(500).json({ error: error.message });
}
});

export default router;