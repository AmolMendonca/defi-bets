const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BettingWithInsuranceAndYield", function () {
  let bettingContract, mockDAI, mockInsuranceToken, mockLendingPool;
  let owner, player1, player2, arbitrator;
  let betAmount;
  
  async function logBalances(msg = "") {
    const bettingContractAddress = await bettingContract.getAddress();
    const lendingPoolAddress = await mockLendingPool.getAddress();
    const mockDAIAddress = await mockDAI.getAddress();

    console.log("\n=== Balance Check:", msg, "===");
    console.log("Betting Contract DAI Balance:", 
      ethers.formatEther(await mockDAI.balanceOf(bettingContractAddress)));
    console.log("Lending Pool DAI Balance:", 
      ethers.formatEther(await mockDAI.balanceOf(lendingPoolAddress)));
    console.log("Lending Pool User Balance:", 
      ethers.formatEther(await mockLendingPool.getBalance(bettingContractAddress, mockDAIAddress)));
  }
  
  beforeEach(async function () {
    [owner, player1, player2, arbitrator] = await ethers.getSigners();
    betAmount = ethers.parseEther("1.0");
    
    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockToken");
    mockDAI = await MockToken.deploy("Mock DAI", "mDAI");
    await mockDAI.waitForDeployment();
    
    mockInsuranceToken = await MockToken.deploy("Mock Insurance", "mINS");
    await mockInsuranceToken.waitForDeployment();
    
    // Deploy mock lending pool
    const MockAaveLendingPool = await ethers.getContractFactory("MockAaveLendingPool");
    mockLendingPool = await MockAaveLendingPool.deploy();
    await mockLendingPool.waitForDeployment();
    
    // Get addresses
    const lendingPoolAddress = await mockLendingPool.getAddress();

    // Deploy betting contract
    const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
    bettingContract = await BettingContract.deploy(
      lendingPoolAddress,
      await mockDAI.getAddress(),
      await mockInsuranceToken.getAddress(),
      owner.address,
      arbitrator.address
    );
    await bettingContract.waitForDeployment();
    const bettingContractAddress = await bettingContract.getAddress();

    // Mint tokens
    const mintAmount = ethers.parseEther("1000");
    await mockDAI.mint(owner.address, mintAmount);
    await mockDAI.mint(player1.address, mintAmount);
    await mockDAI.mint(player2.address, mintAmount);
    await mockDAI.mint(bettingContractAddress, mintAmount);
    await mockDAI.mint(lendingPoolAddress, mintAmount);

    await mockInsuranceToken.mint(owner.address, mintAmount);
    await mockInsuranceToken.mint(player1.address, mintAmount);
    await mockInsuranceToken.mint(player2.address, mintAmount);

    // Set up allowances for lending pool
    await mockDAI.approve(lendingPoolAddress, mintAmount);
    await mockDAI.connect(player1).approve(lendingPoolAddress, mintAmount);
    await mockDAI.connect(player2).approve(lendingPoolAddress, mintAmount);
    
    // Set up allowances for betting contract
    await mockDAI.connect(owner).approve(bettingContractAddress, mintAmount);
    await mockDAI.connect(player1).approve(bettingContractAddress, mintAmount);
    await mockDAI.connect(player2).approve(bettingContractAddress, mintAmount);
    
    // Set up insurance token allowances
    await mockInsuranceToken.approve(bettingContractAddress, mintAmount);
    await mockInsuranceToken.connect(player1).approve(bettingContractAddress, mintAmount);
    await mockInsuranceToken.connect(player2).approve(bettingContractAddress, mintAmount);

    await logBalances("After Setup");
  });

  describe("Bet Resolution", function () {
    beforeEach(async function () {
      await logBalances("Before Creating Bet");
      
      // Create initial bet
      await bettingContract.createBet(player2.address, true, { value: betAmount });
      await logBalances("After Creating Bet");
      
      // Join bet
      await bettingContract.connect(player2).joinBet(0, { value: betAmount });
      await logBalances("After Joining Bet");

      // Verify balance
      const lendingPoolBalance = await mockLendingPool.getBalance(
        await bettingContract.getAddress(),
        await mockDAI.getAddress()
      );
      const expectedBalance = ethers.parseEther("2.0");
      expect(lendingPoolBalance).to.equal(expectedBalance);
    });

    it("Should resolve bet when both parties agree", async function () {
      await bettingContract.confirmWinner(0, player2.address);
      await logBalances("After First Confirmation");
      
      await bettingContract.connect(player2).confirmWinner(0, player2.address);
      await logBalances("After Second Confirmation");
      
      const bet = await bettingContract.bets(0);
      expect(bet.resolved).to.be.true;
      expect(bet.winner).to.equal(player2.address);

      const finalLendingPoolBalance = await mockLendingPool.getBalance(
        await bettingContract.getAddress(),
        await mockDAI.getAddress()
      );
      expect(finalLendingPoolBalance).to.equal(0);
    });
  });
});