// routes/create_bet.js
import express from 'express';
import mongoose from "mongoose";


const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

const router = express.Router();

// Middleware for session handling
// router.use(
//   session({
//     secret: "hackathon-secret", // Change for production
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }, // Set `true` if using HTTPS
//   })
// );

router.post("/login", async (req, res) => {
    try {
      const { walletAddress, name, email } = req.body;
  
      if (!walletAddress || !name || !email) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      let user = await User.findOne({ walletAddress });
  
      if (!user) {
        user = new User({ walletAddress, name, email });
        await user.save();
      }
  
      // Store wallet address in session
      req.session.walletAddress = walletAddress;
      req.session.user = { walletAddress, name, email };
  
      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // Get user session data
  router.get("/session", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "No active session" });
    }
    res.json({ user: req.session.user });
  });
  
  export default router;