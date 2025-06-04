const { ethers } = require("hardhat");

async function main() {
  const [deployer, relayer1, relayer2, relayer3, user] = await ethers.getSigners();

  const fee = ethers.parseEther("0.001");

  // Deploy source chain contract
  const BridgeA = await ethers.getContractFactory("BridgeContractA");
  const bridgeA = await BridgeA.deploy(fee);
  await bridgeA.waitForDeployment();

  // Deploy target chain contract with three relayers but require two signatures
  const BridgeB = await ethers.getContractFactory("BridgeContractB");
  const bridgeB = await BridgeB.deploy([
    relayer1.address,
    relayer2.address,
    relayer3.address
  ], 2);
  await bridgeB.waitForDeployment();

  console.log("BridgeA deployed at", await bridgeA.getAddress());
  console.log("BridgeB deployed at", await bridgeB.getAddress());

  // Listen for events on BridgeA
  bridgeA.on("LockAssetAndSendCommand", async (
    requestId,
    sender,
    recipient,
    targetChainId,
    amount,
    commandCode,
    commandData
  ) => {
    console.log("Detected LockAssetAndSendCommand for", requestId);

    const messageHash = ethers.solidityPackedKeccak256(
      ["bytes32","address","address","uint256","uint256","bytes1","bytes"],
      [requestId, sender, recipient, targetChainId, amount, commandCode, commandData]
    );

    // Sign the message with two relayers (M=2 of N=3)
    const sig1 = await relayer1.signMessage(ethers.getBytes(messageHash));
    const sig2 = await relayer3.signMessage(ethers.getBytes(messageHash));

    const tx = await bridgeB.executeCrossChainCommand(
      requestId,
      sender,
      recipient,
      targetChainId,
      amount,
      commandCode,
      commandData,
      [sig1, sig2]
    );
    await tx.wait();
    console.log("Command executed on BridgeB, tx", tx.hash);
  });

  // Trigger a lock on BridgeA to see the relayer in action
  const amount = ethers.parseEther("5");
  const commandCode = "0x01";
  const commandData = ethers.toUtf8Bytes("hello world");
  const recipient = user.address;
  const targetChainId = 31337;

  const tx = await bridgeA.connect(user).lockAssetAndSendCommand(
    recipient,
    targetChainId,
    amount,
    commandCode,
    commandData,
    { value: fee }
  );
  await tx.wait();
  console.log("Lock transaction sent, tx", tx.hash);

  // Wait some time for the listener to execute
  await new Promise(resolve => setTimeout(resolve, 5000));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
