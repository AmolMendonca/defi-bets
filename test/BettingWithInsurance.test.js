const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BettingWithInsuranceAndYield", function () {
    let bettingContract;
    let mockWeth;
    let mockInsuranceToken;
    let mockAaveLendingPool;
    let owner;
    let creator;
    let participant;
    let arbitrator;
    let insuranceFund;
    
    const BETTING_AMOUNT = ethers.parseEther("1.0");
    const INSURANCE_PREMIUM_RATE = 500; // 5% = 500 basis points

    beforeEach(async function () {
        [owner, creator, participant, arbitrator, insuranceFund] = await ethers.getSigners();

        // Deploy mock WETH
        const MockToken = await ethers.getContractFactory("MockToken");
        mockWeth = await MockToken.deploy("Wrapped Ether", "WETH");
        await mockWeth.waitForDeployment();

        // Deploy mock insurance token
        mockInsuranceToken = await MockToken.deploy("Insurance Token", "INS");
        await mockInsuranceToken.waitForDeployment();

        // Deploy mock Aave lending pool
        const MockAaveLendingPool = await ethers.getContractFactory("MockAaveLendingPool");
        mockAaveLendingPool = await MockAaveLendingPool.deploy();
        await mockAaveLendingPool.waitForDeployment();

        // Deploy betting contract
        const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
        bettingContract = await BettingContract.deploy(
            await mockAaveLendingPool.getAddress(),
            await mockWeth.getAddress(),
            await mockInsuranceToken.getAddress(),
            await mockWeth.getAddress(),
            await insuranceFund.getAddress(),
            await arbitrator.getAddress()
        );
        await bettingContract.waitForDeployment();

        // Fund accounts with ETH
        await owner.sendTransaction({
            to: await mockWeth.getAddress(),
            value: ethers.parseEther("10.0")
        });

        // Mint insurance tokens for testing
        await mockInsuranceToken.mint(creator.address, ethers.parseEther("1000"));
        await mockInsuranceToken.mint(participant.address, ethers.parseEther("1000"));

        // Approve tokens
        await mockInsuranceToken.connect(creator).approve(await bettingContract.getAddress(), ethers.MaxUint256);
        await mockInsuranceToken.connect(participant).approve(await bettingContract.getAddress(), ethers.MaxUint256);
        await mockWeth.connect(creator).approve(await bettingContract.getAddress(), ethers.MaxUint256);
        await mockWeth.connect(participant).approve(await bettingContract.getAddress(), ethers.MaxUint256);
    });

    describe("Contract Deployment", function () {
        it("should deploy with correct initial values", async function () {
            expect(await bettingContract.owner()).to.equal(owner.address);
            expect(await bettingContract.arbitrator()).to.equal(arbitrator.address);
            expect(await bettingContract.insuranceFund()).to.equal(insuranceFund.address);
            expect(await bettingContract.insurancePremiumRate()).to.equal(INSURANCE_PREMIUM_RATE);
        });

        it("should fail deployment with zero addresses", async function () {
            const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
            await expect(BettingContract.deploy(
                ethers.ZeroAddress,
                await mockWeth.getAddress(),
                await mockInsuranceToken.getAddress(),
                await mockWeth.getAddress(),
                await insuranceFund.getAddress(),
                await arbitrator.getAddress()
            )).to.be.revertedWith("Invalid lending pool address");
        });
    });

    describe("Bet Creation", function () {
        it("should create a bet with insurance opted", async function () {
            await bettingContract.connect(creator).createBet(
                participant.address,
                true, // creator insurance opted
                true, // participant insurance opted
                { value: BETTING_AMOUNT }
            );

            const bet = await bettingContract.bets(0);
            expect(bet.creator).to.equal(creator.address);
            expect(bet.participant).to.equal(participant.address);
            expect(bet.amount).to.equal(BETTING_AMOUNT);
            expect(bet.creatorInsuranceOpted).to.be.true;
            expect(bet.participantInsuranceOpted).to.be.true;
        });

        it("should calculate and transfer correct insurance premium", async function () {
            const premium = BETTING_AMOUNT * BigInt(INSURANCE_PREMIUM_RATE) / 10000n;
            const initialBalance = await mockInsuranceToken.balanceOf(insuranceFund.address);

            await bettingContract.connect(creator).createBet(
                participant.address,
                true,
                false,
                { value: BETTING_AMOUNT }
            );

            const finalBalance = await mockInsuranceToken.balanceOf(insuranceFund.address);
            expect(finalBalance - initialBalance).to.equal(premium);
        });

        // Add more tests...
    });

    // Add more test sections...
});