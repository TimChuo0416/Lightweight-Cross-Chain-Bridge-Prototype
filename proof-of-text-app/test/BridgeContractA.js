const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BridgeContractA", function () {
    let BridgeContractAFactory;
    let bridgeA;
    let owner;
    let addr1;
    let addr2; // 在外部 beforeEach 中定義
    const initialFee = ethers.parseEther("0.001"); 

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners(); // addr2 在這裡賦值
        BridgeContractAFactory = await ethers.getContractFactory("BridgeContractA");
        bridgeA = await BridgeContractAFactory.deploy(initialFee);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await bridgeA.owner()).to.equal(owner.address);
        });

        it("Should set the correct initial bridgeFee", async function () {
            expect(await bridgeA.bridgeFee()).to.equal(initialFee);
        });

        it("Should have currentRequestIdNonce initialized to 0", async function () {
            expect(await bridgeA.currentRequestIdNonce()).to.equal(0);
        });

        it("Should have pseudoLockedBalances mapping initialized (e.g., for owner should be 0)", async function () {
            expect(await bridgeA.pseudoLockedBalances(owner.address)).to.equal(0);
        });
    });

    describe("lockAssetAndSendCommand", function() {
        let recipientOnTargetChain; 
        const targetChainId = 11155111; 
        const lockAmount = ethers.parseEther("10"); 
        const commandCode = "0x01";
        const commandData = ethers.toUtf8Bytes("Execute task A");
        const feePaid = initialFee; 

        beforeEach(async function() {
            recipientOnTargetChain = addr2.address; // addr2 已經在外部 beforeEach 中定義
        });

        it("Should succeed, update states, and emit event when correct fee is paid", async function () {
            const initialAddr1LockedBalance = await bridgeA.pseudoLockedBalances(addr1.address);
            const initialNonce = await bridgeA.currentRequestIdNonce();
            const contractAddress = await bridgeA.getAddress();
            const initialContractEthBalance = await ethers.provider.getBalance(contractAddress);

            const tx = await bridgeA.connect(addr1).lockAssetAndSendCommand(
                recipientOnTargetChain,
                targetChainId,
                lockAmount,
                commandCode,
                commandData,
                {value: feePaid}
            );
            await tx.wait();

            expect(await bridgeA.currentRequestIdNonce()).to.equal(initialNonce + BigInt(1));
            expect(await bridgeA.pseudoLockedBalances(addr1.address)).to.equal(initialAddr1LockedBalance + lockAmount);
            expect(await ethers.provider.getBalance(contractAddress)).to.equal(initialContractEthBalance + feePaid);
            
            const network = await ethers.provider.getNetwork();
            const chainId = network.chainId;
            // 確保這個 expectedRequestId 的計算邏輯與你合約中的 keccak256(abi.encodePacked(...)) 完全一致
            const expectedRequestId = ethers.solidityPackedKeccak256(
                ["uint256", "address", "address", "address", "uint256", "uint256", "bytes1", "bytes", "uint256"],
                [
                    chainId,
                    contractAddress,
                    addr1.address,
                    recipientOnTargetChain,
                    targetChainId,
                    lockAmount,
                    commandCode,
                    commandData, // solidityPackedKeccak256 可以直接處理 Uint8Array
                    initialNonce
                ]
            );

            await expect(tx)
                .to.emit(bridgeA, "LockAssetAndSendCommand")
                .withArgs(
                    expectedRequestId, // 驗證計算出的 requestId
                    addr1.address,
                    recipientOnTargetChain,
                    targetChainId,
                    lockAmount,
                    commandCode,
                    ethers.hexlify(commandData) 
                );
        });

        it("Should revert if insufficient fee is provided", async function () {
            const insufficientFee = ethers.parseEther("0.0001");
            await expect(bridgeA.connect(addr1).lockAssetAndSendCommand(
                recipientOnTargetChain,
                targetChainId,
                lockAmount,
                commandCode,
                commandData,
                { value: insufficientFee }
            )).to.be.revertedWith("BridgeContractA: Insufficient fee provided");
        });

        it("Should revert if lock amount is 0", async function () {
            await expect(bridgeA.connect(addr1).lockAssetAndSendCommand(
                recipientOnTargetChain,
                targetChainId,
                0, // lock amount 為 0
                commandCode,
                commandData,
                { value: feePaid }
            )).to.be.revertedWith("BridgeContractA: Amount must be greater than 0");
        });
    });

    describe("withdrawFees", function () {
        it("Should allow owner to withdraw fees and emit FeesWithdrawn event", async function () {
            // 先進行一次 lock 操作以產生費用
            await bridgeA.connect(addr1).lockAssetAndSendCommand(
                addr2.address, // recipient
                123,           // targetChainId
                ethers.parseEther("1"), // amount
                "0x01",        // commandCode
                ethers.toUtf8Bytes("data for fee generation"), // commandData
                { value: initialFee }
            );

            const contractAddress = await bridgeA.getAddress();
            const contractBalanceBeforeWithdraw = await ethers.provider.getBalance(contractAddress);
            const ownerBalanceBeforeWithdraw = await ethers.provider.getBalance(owner.address);


            const tx = await bridgeA.connect(owner).withdrawFees();
            const receipt = await tx.wait();
            
            // --- 嘗試不同的方式獲取 Gas 成本 ---
            let gasCost = BigInt(0);
            if (receipt && receipt.gasUsed) {
                if (receipt.effectiveGasPrice) { // 優先使用 effectiveGasPrice
                    gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
                    console.log("Gas Cost (from effectiveGasPrice):", gasCost.toString());
                } else if (tx.gasPrice) { // 如果 effectiveGasPrice 不可用，嘗試 tx.gasPrice (通常用於 legacy 交易)
                    gasCost = receipt.gasUsed * tx.gasPrice;
                    console.log("Gas Cost (from tx.gasPrice):", gasCost.toString());
                } else {
                    console.log("Warning: Could not determine gas price from receipt or transaction response.");
                }
            }
        
            const actualOwnerBalanceAfterWithdraw = await ethers.provider.getBalance(owner.address);
            const expectedOwnerBalanceAfterWithdraw = ownerBalanceBeforeWithdraw + contractBalanceBeforeWithdraw - gasCost; // 使用新計算的 gasCost
            
            expect(await ethers.provider.getBalance(contractAddress)).to.equal(0);
            expect(actualOwnerBalanceAfterWithdraw).to.equal(expectedOwnerBalanceAfterWithdraw); // 使用更新後的期望值
            
            await expect(tx)
                .to.emit(bridgeA, "FeesWithdrawn")
                .withArgs(owner.address, contractBalanceBeforeWithdraw);
        });

        it("Should revert if non-owner tries to withdraw fees", async function () {
            await bridgeA.connect(addr1).lockAssetAndSendCommand(addr2.address, 123, ethers.parseEther("1"), "0x01", ethers.toUtf8Bytes("data"), { value: initialFee });
            
            await expect(bridgeA.connect(addr1).withdrawFees())
                .to.be.revertedWithCustomError(bridgeA, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("Should revert if trying to withdraw with no fees accumulated", async function () {
            await expect(bridgeA.connect(owner).withdrawFees())
                .to.be.revertedWith("BridgeContractA: No fees to withdraw");
        });
    });

    describe("unlockPseudoAsset", function () {
        const lockAmountForUnlockTest = ethers.parseEther("5");

        beforeEach(async function() {
            // 在每個 unlockPseudoAsset 測試前，先為 addr1 鎖定一些資產
            await bridgeA.connect(addr1).lockAssetAndSendCommand(
                addr2.address, // recipient
                456,           // targetChainId
                lockAmountForUnlockTest, // amount
                "0x02",        // commandCode
                ethers.toUtf8Bytes("unlock test data"), // commandData
                { value: initialFee }
            );
        });

        it("Should allow user to unlock their pseudo assets and emit UnlockEvent", async function () {
            const initialLockedBalance = await bridgeA.pseudoLockedBalances(addr1.address);
            const unlockAmount = ethers.parseEther("3");

            const tx = await bridgeA.connect(addr1).unlockPseudoAsset(unlockAmount);
            await tx.wait();

            expect(await bridgeA.pseudoLockedBalances(addr1.address)).to.equal(initialLockedBalance - unlockAmount);
            
            await expect(tx)
                .to.emit(bridgeA, "UnlockEvent") // 你的合約中定義的是 UnlockEvent
                .withArgs(addr1.address, unlockAmount);
        });

        it("Should revert if trying to unlock more than locked balance", async function () {
            const attemptUnlockAmount = lockAmountForUnlockTest + ethers.parseEther("1"); 
            
            await expect(
                bridgeA.connect(addr1).unlockPseudoAsset(attemptUnlockAmount)
            ).to.be.revertedWith("BridgeContractA: Insufficient locked balance");
        });

         it("Should allow user to unlock their full pseudo assets balance", async function () {
            const initialLockedBalance = await bridgeA.pseudoLockedBalances(addr1.address);
            
            const tx = await bridgeA.connect(addr1).unlockPseudoAsset(initialLockedBalance);
            await tx.wait();

            expect(await bridgeA.pseudoLockedBalances(addr1.address)).to.equal(0);
            
            await expect(tx)
                .to.emit(bridgeA, "UnlockEvent") 
                .withArgs(addr1.address, initialLockedBalance);
        });
    });
});