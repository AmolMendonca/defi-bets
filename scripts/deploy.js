const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy mock tokens first (for testnet demo)
  const MockToken = await ethers.getContractFactory("MockToken");
  console.log("Deploying Mock DAI...");
  const mockDAI = await MockToken.deploy("Mock DAI", "mDAI");
  await mockDAI.waitForDeployment();
  console.log("Mock DAI deployed to:", await mockDAI.getAddress());

  console.log("Deploying Mock Insurance Token...");
  const mockInsuranceToken = await MockToken.deploy("Mock Insurance", "mINS");
  await mockInsuranceToken.waitForDeployment();
  console.log("Mock Insurance Token deployed to:", await mockInsuranceToken.getAddress());

  // Deploy Mock Lending Pool
  console.log("Deploying Mock Lending Pool...");
  const MockAaveLendingPool = await ethers.getContractFactory("MockAaveLendingPool");
  const mockLendingPool = await MockAaveLendingPool.deploy();
  await mockLendingPool.waitForDeployment();
  console.log("Mock Lending Pool deployed to:", await mockLendingPool.getAddress());

  // Deploy Betting Contract
  console.log("Deploying Betting Contract...");
  const BettingContract = await ethers.getContractFactory("BettingWithInsuranceAndYield");
  const betting = await BettingContract.deploy(
    await mockLendingPool.getAddress(),
    await mockDAI.getAddress(),
    await mockInsuranceToken.getAddress(),
    deployer.address, // Insurance fund
    deployer.address  // Arbitrator
  );
  await betting.waitForDeployment();
  console.log("Betting Contract deployed to:", await betting.getAddress());

  // Verify on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts on Etherscan...");
    await hre.run("verify:verify", {
      address: await betting.getAddress(),
      constructorArguments: [
        await mockLendingPool.getAddress(),
        await mockDAI.getAddress(),
        await mockInsuranceToken.getAddress(),
        deployer.address,
        deployer.address
      ],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });