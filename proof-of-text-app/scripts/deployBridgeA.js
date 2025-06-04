// scripts/deployBridgeA.js
async function main() {
    const initialFeeForA = ethers.parseEther("0.001"); // 與 BridgeContractA 的 constructor 一致
    const BridgeAFactory = await ethers.getContractFactory("BridgeContractA");
    const bridgeA = await BridgeAFactory.deploy(initialFeeForA);
    await bridgeA.waitForDeployment(); 
    console.log("BridgeContractA deployed to:", await bridgeA.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});