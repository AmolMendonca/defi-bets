// routes/create_bet.js
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const Bet = mongoose.models.Bet; 

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

    res.json({
    success: true,
    message: "Bet joined successfully",
    bet: updatedBet
    });

} catch (error) {
    res.status(500).json({ error: error.message });
}
});

export default router;