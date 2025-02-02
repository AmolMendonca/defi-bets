// scripts/check-bet.js
const { ethers } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x842FfB04c9fb65ee3594C9b461129315437B0e2E";
  const BET_ID = 0; // The first bet should have ID 0

  const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
  const contract = await BettingContract.attach(CONTRACT_ADDRESS);

  const bet = await contract.bets(BET_ID);
  console.log("Bet Details for ID:", BET_ID);
  console.log("- Creator:", bet.creator);
  console.log("- Participant:", bet.participant);
  console.log("- Amount:", ethers.formatEther(bet.amount), "ETH");
  console.log("- Resolved:", bet.resolved);
  console.log("- Creator Insurance:", bet.creatorInsuranceOpted);
  console.log("- Participant Insurance:", bet.participantInsuranceOpted);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });