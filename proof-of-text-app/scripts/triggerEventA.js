// scripts/triggerEventA.js
async function main() {
    const contractAddressA = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替換成你的地址
    const bridgeA = await ethers.getContractAt("BridgeContractA", contractAddressA);
    const [owner, addr1, addr2] = await ethers.getSigners();

    const recipientOnTarget = addr2.address;
    const targetChainId = 12345;
    const amount = ethers.parseEther("1");
    const commandCode = "0x01";
    const commandData = ethers.toUtf8Bytes("Hello from trigger script!");
    const fee = await bridgeA.bridgeFee();

    console.log(`Calling lockAssetAndSendCommand on ${contractAddressA} from ${addr1.address}...`);
    const tx = await bridgeA.connect(addr1).lockAssetAndSendCommand(
        recipientOnTarget, targetChainId, amount, commandCode, commandData, { value: fee }
    );
    await tx.wait();
    console.log("Transaction sent, hash:", tx.hash);
    console.log("LockAssetAndSendCommand event should have been emitted.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });