// routes/create_bet.js
import express from "express";
import mongoose from "mongoose";

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

const Bet = mongoose.models.Bet || mongoose.model('Bet', betSchema);

router.post("/create-bet", async (req, res) => {
  try {
    const { amount, owner_insurance_opted, betTitle, betTerms } = req.body;

    // Get creator from session
    // const creator = "0x562A86127c3CD49864cbfeF6944C5A384c478E26";
    const creator = req.session.walletAddress;
    if (!creator) {
      return res.status(401).json({ error: "No wallet connected" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Create and store bet in MongoDB
    const bet = new Bet({
      bet_title: betTitle,
      bet_terms: betTerms,
      creator: creator,
      participant: "TBD", // Will be filled later when participant joins
      amount: amount, // Store as normal number (assumed to be in ETH)
      owner_insurance_opted: owner_insurance_opted,
    });

    await bet.save();

    res.json({
      success: true,
      message: "Bet created successfully and waiting for a participant",
      betId: bet._id, // Auto-generated MongoDB bet ID
      bet,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
