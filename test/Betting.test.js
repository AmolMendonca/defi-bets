const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Betting Contract", function () {
    let Betting, betting, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        Betting = await ethers.getContractFactory("Betting");
        betting = await Betting.deploy();
        await betting.deployed();
    });

    it("Should create a bet", async function () {
        await betting.connect(addr1).createBet(addr2.address, { value: ethers.utils.parseEther("1.0") });
        const bet = await betting.bets(0);
        expect(bet.creator).to.equal(addr1.address);
        expect(bet.participant).to.equal(addr2.address);
        expect(bet.amount).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("Should resolve a bet and pay the winner", async function () {
        await betting.connect(addr1).createBet(addr2.address, { value: ethers.utils.parseEther("1.0") });
        await betting.connect(addr1).resolveBet(0, addr1.address);

        const bet = await betting.bets(0);
        expect(bet.resolved).to.equal(true);
        expect(bet.winner).to.equal(addr1.address);
    });

    it("Should fail if non-participant tries to resolve", async function () {
        await betting.connect(addr1).createBet(addr2.address, { value: ethers.utils.parseEther("1.0") });
        await expect(betting.connect(owner).resolveBet(0, addr1.address)).to.be.revertedWith("Winner must be a participant");
    });
});