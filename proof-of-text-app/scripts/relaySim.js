const { ethers } = require("hardhat");

async function main() {
  const [deployer, relayer1, relayer2, relayer3, user] = await ethers.getSigners();

  // Deploy BridgeContractA
  const fee = ethers.parseEther("0.001");
  const BridgeA = await ethers.getContractFactory("BridgeContractA");
  const bridgeA = await BridgeA.deploy(fee);
  await bridgeA.waitForDeployment();

  // Deploy BridgeContractB with three relayers but only require M=2 signatures
  const BridgeB = await ethers.getContractFactory("BridgeContractB");
  const bridgeB = await BridgeB.deploy([
    relayer1.address,
    relayer2.address,
    relayer3.address
  ], 2); // M = 2, N = 3
  await bridgeB.waitForDeployment();

  console.log("BridgeA deployed at", await bridgeA.getAddress());
  console.log("BridgeB deployed at", await bridgeB.getAddress());

  // User locks pseudo assets on BridgeA
  const amount = ethers.parseEther("5");
  const commandCode = "0x01";
  const commandData = ethers.toUtf8Bytes("hello world");
  const recipient = user.address; // send back to user for demo
  const targetChainId = 31337; // same chain id in this simulation

  const lockTx = await bridgeA.connect(user).lockAssetAndSendCommand(
    recipient,
    targetChainId,
    amount,
    commandCode,
    commandData,
    { value: fee }
  );
  const receipt = await lockTx.wait();
  const event = receipt.logs.find((log) => log.fragment?.name === "LockAssetAndSendCommand");
  const requestId = event.args.requestId;
  console.log("Lock event emitted requestId:", requestId);

  // Compose message hash for BridgeB
  const messageHash = ethers.solidityPackedKeccak256(
    ["bytes32","address","address","uint256","uint256","bytes1","bytes"],
    [requestId, user.address, recipient, targetChainId, amount, commandCode, commandData]
  );

  // Relayers sign the message
  // Demonstrate M-of-N by letting only two of the three relayers sign
  const sig1 = await relayer1.signMessage(ethers.getBytes(messageHash));
  const sig3 = await relayer3.signMessage(ethers.getBytes(messageHash));
  const signatures = [sig1, sig3];

  // Relay to BridgeB
  const execTx = await bridgeB.executeCrossChainCommand(
    requestId,
    user.address,
    recipient,
    targetChainId,
    amount,
    commandCode,
    commandData,
    signatures
  );
  await execTx.wait();
  console.log("Command executed on BridgeB, tx", execTx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
