const { ethers } = require("hardhat");

async function main() {
  const [deployer, creator, participant, arbitrator] = await ethers.getSigners();
  console.log("Deploying contracts with", deployer.address);

  // Deploy Mock Token
  const MockToken = await ethers.getContractFactory("MockToken");
  const depositToken = await MockToken.deploy("Mock DAI", "mDAI");
  const insuranceToken = await MockToken.deploy("Insurance Token", "INS");
  await depositToken.deployed();
  await insuranceToken.deployed();
  console.log("Mock Tokens deployed:", {
    depositToken: depositToken.address,
    insuranceToken: insuranceToken.address
  });

  // Deploy Mock Aave Lending Pool
  const MockAaveLendingPool = await ethers.getContractFactory("MockAaveLendingPool");
  const lendingPool = await MockAaveLendingPool.deploy();
  await lendingPool.deployed();
  console.log("Mock Lending Pool deployed:", lendingPool.address);

  // Deploy Betting Contract
  const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
  const betting = await BettingContract.deploy(
    lendingPool.address,
    depositToken.address,
    insuranceToken.address,
    deployer.address, // insurance fund
    arbitrator.address
  );
  await betting.deployed();
  console.log("Betting Contract deployed:", betting.address);

  // Mint tokens to creator and participant
  const betAmount = ethers.utils.parseEther("100");
  const insurancePremium = betAmount.mul(5).div(100); // 5% premium
  
  await depositToken.mint(creator.address, betAmount);
  await depositToken.mint(participant.address, betAmount);
  await insuranceToken.mint(creator.address, insurancePremium);
  await insuranceToken.mint(participant.address, insurancePremium);
  
  console.log("Tokens minted to participants");

  // Approve tokens for betting contract
  await depositToken.connect(creator).approve(betting.address, betAmount);
  await depositToken.connect(participant).approve(betting.address, betAmount);
  await insuranceToken.connect(creator).approve(betting.address, insurancePremium);
  await insuranceToken.connect(participant).approve(betting.address, insurancePremium);
  
  // Also approve tokens for lending pool
  await depositToken.connect(creator).approve(lendingPool.address, betAmount);
  await depositToken.connect(participant).approve(lendingPool.address, betAmount);
  
  console.log("Token approvals granted");

  // Create a bet
  console.log("Creating bet...");
  const tx = await betting.connect(creator).createBet(
    participant.address,
    true, // creator wants insurance
    true, // participant wants insurance
    { value: betAmount }
  );
  const receipt = await tx.wait();
  const betId = receipt.events.find(e => e.event === "BetCreated").args.betId;
  console.log("Bet created with ID:", betId.toString());

  // Join the bet
  console.log("Participant joining bet...");
  await betting.connect(participant).joinBet(betId, { value: betAmount });

  // Simulate some time passing (if your mock supports it)
  // await network.provider.send("evm_increaseTime", [3600]); // 1 hour
  // await network.provider.send("evm_mine");

  // Confirm winners
  console.log("Confirming winner...");
  await betting.connect(creator).confirmWinner(betId, creator.address);
  await betting.connect(participant).confirmWinner(betId, creator.address);

  // Check final balances
  const creatorBalance = await depositToken.balanceOf(creator.address);
  console.log("Creator final balance:", ethers.utils.formatEther(creatorBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });