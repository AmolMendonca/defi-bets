// routes/create_bet.js
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Bet Schema
const betSchema = new mongoose.Schema({
  bet_id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Auto-generated unique ID
  bet_title: String,
  bet_terms: String,
  creator: String,
  participant: { type: String, default: "TBD" }, // Initially unknown
  amount: Number,
  created_at: { type: Date, default: Date.now }, // Auto-set creation time
  owner_insurance_opted: Boolean,
  participant_insurance_opted: Boolean
});

const Bet = mongoose.model('Bet', betSchema);

router.post("/join-bet", async (req, res) => {
  try {
    const { betid, participant_insurance_opted } = req.body;

    // Get creator from session
    const participant = "0x76AA40cBBf4ca79d1558745800531a2c8f66507e";
    if (!participant) {
      return res.status(401).json({ error: "No wallet connected" });
    }

    if (!mongoose.Types.ObjectId.isValid(betid)) {
        return res.status(400).json({ error: "Invalid Bet ID" });
      }

    const updatedBet = await Bet.findOneAndUpdate(
    { _id: betid, participant: "TBD" }, // Ensure no one has joined before
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