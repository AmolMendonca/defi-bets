// scripts/test-join-bet.js
const { ethers } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x842FfB04c9fb65ee3594C9b461129315437B0e2E";
  const BET_ID = 0; // The bet we just created

  const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
  const contract = await BettingContract.attach(CONTRACT_ADDRESS);

  try {
    console.log("Joining bet...");
    
    // We need to send exactly 0.01 ETH as specified in the bet
    const betAmount = ethers.parseEther("0.001");
    
    const tx = await contract.joinBet(BET_ID, { 
      value: betAmount 
    });

    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Check if the ParticipantJoined event was emitted
    const joinEvent = receipt.events?.find(e => e.event === "ParticipantJoined");
    if (joinEvent) {
      console.log("Successfully joined bet!");
      console.log("- Bet ID:", BET_ID);
      console.log("- Participant:", joinEvent.args.participant);
    }

    // Get updated bet details
    const bet = await contract.bets(BET_ID);
    console.log("\nUpdated Bet Status:");
    console.log("- Creator:", bet.creator);
    console.log("- Participant:", bet.participant);
    console.log("- Amount:", ethers.formatEther(bet.amount), "ETH");
    console.log("- Resolved:", bet.resolved);

  } catch (error) {
    console.error("Error:", error);
    // Log more details about the error
    if (error.data) {
      const decodedError = contract.interface.parseError(error.data);
      console.error("Decoded error:", decodedError);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });