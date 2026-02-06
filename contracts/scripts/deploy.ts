import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await ComplianceRegistry.deploy();
    await complianceRegistry.waitForDeployment();
    const complianceAddress = await complianceRegistry.getAddress();
    console.log("ComplianceRegistry deployed to:", complianceAddress);

    // 2. Deploy AssetOracle
    const AssetOracle = await ethers.getContractFactory("AssetOracle");
    const assetOracle = await AssetOracle.deploy();
    await assetOracle.waitForDeployment();
    const oracleAddress = await assetOracle.getAddress();
    console.log("AssetOracle deployed to:", oracleAddress);

    // 3. Deploy AssetToken (ERC20 - Fungible)
    const AssetToken = await ethers.getContractFactory("AssetToken");
    const assetToken = await AssetToken.deploy("Gold", "GLD", complianceAddress);
    await assetToken.waitForDeployment();
    const tokenAddress = await assetToken.getAddress();
    console.log("AssetToken deployed to:", tokenAddress);

    // 4. Deploy AssetNFT (ERC721 - Non-Fungible)
    const AssetNFT = await ethers.getContractFactory("AssetNFT");
    const assetNFT = await AssetNFT.deploy(complianceAddress);
    await assetNFT.waitForDeployment();
    const nftAddress = await assetNFT.getAddress();
    console.log("AssetNFT deployed to:", nftAddress);

    // 5. Deploy SimpleDEX
    // Set initial price in Oracle first (0.01 ETH)
    const initialPrice = ethers.parseEther("0.01");
    await assetOracle.updatePrice("GLD", initialPrice);
    console.log("Oracle price set for GLD: 0.01 ETH");

    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    // Pass token AND oracle address
    const simpleDEX = await SimpleDEX.deploy(tokenAddress, oracleAddress);
    await simpleDEX.waitForDeployment();
    const dexAddress = await simpleDEX.getAddress();
    console.log("SimpleDEX deployed to:", dexAddress);

    // --- Setup & Initial Configuration ---

    // Whitelist deployer
    await complianceRegistry.addToWhitelist(deployer.address);
    console.log("Whitelisted deployer");

    // Mint ERC20 tokens
    const mintAmount = ethers.parseEther("100000"); // 100k tokens
    await assetToken.mint(deployer.address, mintAmount);
    console.log("Minted 100k GLD tokens to deployer");

    // Mint NFT (The Mona Lisa)
    await assetNFT.mint(deployer.address, "Mona Lisa #1 - Analysis");
    console.log("Minted Mona Lisa NFT to deployer");

    // Approve DEX
    await assetToken.approve(dexAddress, mintAmount);

    // Whitelist DEX
    await complianceRegistry.addToWhitelist(dexAddress);
    console.log("Whitelisted DEX contract");

    // Liquidity
    await assetToken.transfer(dexAddress, ethers.parseEther("50000"));
    await deployer.sendTransaction({ to: dexAddress, value: ethers.parseEther("10") });
    console.log("Provided Liquidity to DEX");

    // --- Save to Frontend ---
    const fs = require("fs");
    const path = require("path");

    // Ensure directory exists
    const contractsDir = path.join(__dirname, "../../frontend/src/lib");
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    const contractsConfig = {
        complianceAddress,
        oracleAddress,
        tokenAddress,
        nftAddress,
        dexAddress,
        networkId: "31337"
    };

    fs.writeFileSync(
        path.join(contractsDir, "contracts-config.json"),
        JSON.stringify(contractsConfig, null, 2)
    );
    console.log("Contracts config saved to frontend/src/lib/contracts-config.json");

    // --- Notify Indexer ---
    const indexerUrl = process.env.INDEXER_URL || "http://localhost:3001";
    try {
        const response = await fetch(`${indexerUrl}/init-contracts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contractsConfig)
        });
        if (response.ok) {
            console.log("Indexer initialized successfully!");
        } else {
            console.error("Failed to initialize indexer:", response.statusText);
        }
    } catch (error) {
        console.warn("Could not contact Indexer (is it running?):", error);
    }

    console.log("Deployment and Setup Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
