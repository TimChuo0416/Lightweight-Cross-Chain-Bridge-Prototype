// Import necessary modules from Hardhat and Chai
const { expect } = require("chai");
const { ethers } = require("hardhat"); // ethers.js is integrated with Hardhat

// Describe the test suite for the ProofOfText contract
describe("ProofOfText Contract Tests", function () {
    let proofOfText; // Variable to hold the deployed contract instance
    let owner; // Variable to hold the deployer/owner address
    let addr1; // Variable to hold another account address
    let addr2; // Variable to hold yet another account address

    // This `beforeEach` block runs before each test (`it` block)
    beforeEach(async function () {
        // Get signers (accounts) provided by Hardhat Network
        [owner, addr1, addr2] = await ethers.getSigners();

        // Get the ContractFactory for ProofOfText
        const ProofOfTextFactory = await ethers.getContractFactory("ProofOfText");

        // Deploy a new instance of the contract before each test
        proofOfText = await ProofOfTextFactory.deploy();
        // wait for the contract to be deployed
        // await proofOfText.deployed(); // Note: .deployed() is deprecated, deployment happens on resolution now.
        // Deployment transaction receipt can be waited upon if needed: await proofOfText.deploymentTransaction().wait(1);
    });

    // Test case 1: Locking and retrieving a message
    it("Should lock a message for a user and allow retrieval", async function () {
        const testMessage = "Hello Hardhat!";

        // addr1 calls lockMessage
        // We can optionally send some ETH using the 'value' option
        const lockTx = await proofOfText.connect(addr1).lockMessage(testMessage, { value: ethers.parseEther("0.001") });

        // Wait for the transaction to be mined
        await lockTx.wait();

        // Retrieve the message stored for addr1
        const retrievedMessage = await proofOfText.getMessage(addr1.address);

        // Assert that the retrieved message is correct
        expect(retrievedMessage).to.equal(testMessage);
    });

    // Test case 2: Overwriting a message and retrieving the new one
    it("Should allow a user to overwrite their message", async function () {
        const firstMessage = "First message.";
        const secondMessage = "This is the second message.";

        // addr1 locks the first message
        await proofOfText.connect(addr1).lockMessage(firstMessage);
        // Retrieve and check the first message
        expect(await proofOfText.getMessage(addr1.address)).to.equal(firstMessage);

        // addr1 locks the second message (overwriting the first)
        await proofOfText.connect(addr1).lockMessage(secondMessage);
        // Retrieve and check the second message
        expect(await proofOfText.getMessage(addr1.address)).to.equal(secondMessage);
    });

    // Test case 3: Retrieving message for a user who hasn't locked one
    it("Should return an empty string for a user who hasn't locked a message", async function () {
        // addr2 hasn't locked any message yet
        const retrievedMessage = await proofOfText.getMessage(addr2.address);

        // Assert that the retrieved message is an empty string
        expect(retrievedMessage).to.equal("");
    });

     // Test case 4: Checking the emitted event
    it("Should emit a MessageLocked event on lockMessage", async function () {
        const testMessage = "Event test";
        const testValue = ethers.parseEther("0.002"); // Amount of ETH to send

        // Call lockMessage and check if the 'MessageLocked' event is emitted
        // with the correct arguments
        await expect(proofOfText.connect(addr1).lockMessage(testMessage, { value: testValue }))
            .to.emit(proofOfText, "MessageLocked") // Check event emission from the contract
            .withArgs(addr1.address, testMessage, testValue); // Check if event arguments match
    });

    // Test case 5: Ensure different users have different messages
    it("Should store messages for different users independently", async function () {
        const message1 = "Addr1's message";
        const message2 = "Addr2's message";

        // addr1 locks their message
        await proofOfText.connect(addr1).lockMessage(message1);
        // addr2 locks their message
        await proofOfText.connect(addr2).lockMessage(message2);

        // Retrieve messages for both users
        const retrieved1 = await proofOfText.getMessage(addr1.address);
        const retrieved2 = await proofOfText.getMessage(addr2.address);

        // Assert that each user has their correct message
        expect(retrieved1).to.equal(message1);
        expect(retrieved2).to.equal(message2);
        expect(retrieved1).to.not.equal(retrieved2); // Ensure they are different
    });
});