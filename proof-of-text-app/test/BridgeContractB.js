const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BridgeContractB", function () {
    let BridgeBFactory;
    let bridgeB;
    let owner;
    let relayer1, relayer2, relayer3; // 測試用的中繼器帳戶
    let addr1; // 測試用的其他帳戶 (例如發起者和接收者)
    
    // --- 部署時的常量 ---
    const initialMThreshold = 2; 
    let initialRelayersAddresses; // 將在 beforeEach 中填充

    beforeEach(async function () {
        // 獲取簽名者帳戶
        [owner, relayer1, relayer2, relayer3, addr1] = await ethers.getSigners();
        
        // 準備初始中繼器地址列表
        initialRelayersAddresses = [relayer1.address, relayer2.address, relayer3.address]; // N = 3

        // 獲取合約工廠
        BridgeBFactory = await ethers.getContractFactory("BridgeContractB");
        
        // 部署合約，傳入初始中繼器列表和 M_threshold
        bridgeB = await BridgeBFactory.deploy(initialRelayersAddresses, initialMThreshold);
        // await bridgeB.deployed(); // 在新版 Hardhat/ethers 中通常不需要
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            // 驗證合約的 owner 是否為部署者 (owner.address)
            expect(await bridgeB.owner()).to.equal(owner.address);
        });

        it("Should set the correct initial M_threshold", async function () {
            // 驗證合約的 M_threshold 是否等於部署時傳入的 initialMThreshold
            expect(await bridgeB.M_threshold()).to.equal(initialMThreshold);
        });

        it("Should correctly set initial relayers in the isRelayer mapping", async function () {
            // 驗證 initialRelayersAddresses 中的每個地址在 isRelayer mapping 中是否為 true
            for (const relayerAddress of initialRelayersAddresses) {
                expect(await bridgeB.isRelayer(relayerAddress)).to.be.true;
            }
        });

        it("Should not mark an unset address as a relayer", async function () {
            // TODO 4: 驗證一個未在 initialRelayersAddresses 中指定的地址 (例如 owner.address 或一個全新的 Signer
            const nonRelayer = (await ethers.getSigners())[4]; // 假設有第五個 signer
            expect(await bridgeB.isRelayer(owner.address)).to.be.false; // 如果 owner 不是初始 relayer
            expect(await bridgeB.isRelayer(nonRelayer.address)).to.be.false;
        });

        it("Should have processedRequestIds mapping initialized (e.g., for a random requestId should be false)", async function () {
            // 驗證 processedRequestIds mapping 對於一個隨機的 bytes32 ID，其值應為 fals
            const randomRequestId = ethers.randomBytes(32);
            expect(await bridgeB.processedRequestIds(randomRequestId)).to.be.false;
        });

        it("Should have alreadySignedThisSpecificRequest mapping initialized", async function () {
            // 驗證 alreadySignedThisSpecificRequest mapping 對於隨機 requestId 和 relayer 地址，其值應為 false
            const randomRequestId = ethers.randomBytes(32);
            expect(await bridgeB.alreadySignedThisSpecificRequest(randomRequestId, relayer1.address)).to.be.false;
        });
    });
    // --- executeCrossChainCommand 函數測試 ---
    describe("executeCrossChainCommand", function () {
        // --- 測試常量和變數 ---
        let requestId;
        let originalSender; // 通常是 addr1 (在 BridgeContractA 的測試中)
        let recipient; // 通常是 addr2
        const sourceChainId = 31337; // 假設源鏈是本地 Hardhat 網絡
        const amount = ethers.parseEther("5");
        const commandCode = "0x01";
        const commandData = ethers.toUtf8Bytes("Sample Command Data");
        
        let messageHash; // 重構的消息哈希

        // 中繼器帳戶 (在外部 beforeEach 中已定義: relayer1, relayer2, relayer3)
        // 初始中繼器和 M 值 (在外部 beforeEach 中已定義: initialRelayersAddresses, initialMThreshold)

        beforeEach(async function() {
            // --- 初始化階段 (Arrange) ---
            requestId = ethers.randomBytes(32); // 生成隨機 bytes32 作為 requestId
            originalSender = owner.address; // 假設 owner 是源鏈的發起者
            recipient = addr1.address; // 假設 addr1 是目標鏈的接收者
            
            //   - 使用 ethers.js 的 keccak256 和 AbiCoder 來計算 messageHash。
            messageHash = ethers.solidityPackedKeccak256(
                ["bytes32", "address", "address", "uint256", "uint256", "bytes1", "bytes"],
                [requestId, originalSender, recipient, sourceChainId, amount, commandCode, commandData]
            );
            //   - 為了讓中繼器簽名，我們需要對 messageHash 進行以太坊標準前綴處理。
        });

        it("Should succeed when M valid signatures from distinct authorized relayers are provided", async function () {
            // --- 準備階段 (Arrange) ---

            // 生成 M 個有效簽名, M_threshold = 2
            const signaturesArray = [];
            const relayers = [relayer1, relayer2]; // 假設我們選擇了 relayer1 和 relayer2
            for (const relayer of relayers) {
                const signature = await relayer.signMessage(ethers.getBytes(messageHash)); // 將 bytes32 轉為 Uint8Array
                signaturesArray.push(signature);
            }
            // --- 操作階段 (Act) ---
            // TODO 4: 由任意帳戶 (例如 owner 或 addr1) 調用 executeCrossChainCommand
            //   - 傳入所有必要的原始事件數據、requestId 和上面生成的 signaturesArray。
            
            // YOUR CODE HERE for the transaction call
            const tx = await bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )

            // --- 斷言階段 (Assert) ---
            //   - 驗證 tx 是否成功執行。
            expect(await bridgeB.processedRequestIds(requestId)).to.be.true;

            //   - 驗證 isRelayer 中的 relayer1 和 relayer2 是否仍然為 true。
            expect(await bridgeB.alreadySignedThisSpecificRequest(requestId, relayer1.address)).to.be.true;
            expect(await bridgeB.alreadySignedThisSpecificRequest(requestId, relayer2.address)).to.be.true;
            expect(await bridgeB.alreadySignedThisSpecificRequest(requestId, relayer3.address)).to.be.false; // relayer3 沒有簽名

    
            //   - 使用 expect(tx).to.emit(bridgeB, "CommandExecuted") 來驗證事件。
            await expect(tx).to.emit(bridgeB, "CommandExecuted").withArgs(
                requestId,
                recipient,
                amount,
                commandCode,
                commandData,
                "Command executed successfully"
            );
        });

        
        it("Should revert if the requestId has already been processed", async function () {
            // --- 準備階段 (Arrange) ---
            // 先成功執行一次 executeCrossChainCommand 來將 requestId 標記為已處理
    
            const signaturesArray = [];
            const relayers = [relayer1, relayer2, relayer3];
            for (const relayer of relayers) {
                const signature = await relayer.signMessage(ethers.getBytes(messageHash)); // 將 bytes32 轉為 Uint8Array
                signaturesArray.push(signature);
            }
            await bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            );
            // 驗證 tx 是否成功執行。
            expect(await bridgeB.processedRequestIds(requestId)).to.be.true;
            // --- 操作並斷言階段 (Act & Assert) ---
            // 再次使用相同的參數 (特別是相同的 requestId) 調用 executeCrossChainCommand
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWith("BridgeContractB: Request already processed");
        });

        it("Should revert if not enough signatures are provided initially to meet M_threshold", async function () {
            // --- 準備階段 (Arrange) ---
            // 生成少於 M_threshold 個的簽名
            const singleSignature = await relayer1.signMessage(ethers.getBytes(messageHash));
            const signaturesArray = [singleSignature];

            // --- 操作並斷言階段 (Act & Assert) ---
            //   - 斷言它會 revertedWith "BridgeContractB: Not enough signatures provided to meet threshold initially"
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWith("BridgeContractB: Not enough valid signatures");
        });

        it("Should revert if a signature is from a non-authorized relayer", async function () {
            // --- 準備階段 (Arrange) ---
            const nonRelayer = addr1; // addr1 未在部署時設為初始中繼器
            // 生成一組簽名，其中至少有一個簽名來自 nonRelayer，其餘 M-1 個來自授權中繼器
            
            const sigRelayer1 = await relayer1.signMessage(ethers.getBytes(messageHash));
            const sigNonRelayer = await nonRelayer.signMessage(ethers.getBytes(messageHash));
            const signaturesArray = [sigRelayer1, sigNonRelayer];

            // --- 操作並斷言階段 (Act & Assert) ---
            //   - 斷言它會 revertedWith "BridgeContractB: Signature is from a non-authorized relayer"
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWith("BridgeContractB: Signer is not an authorized relayer");
        });

        it("Should revert if an authorized relayer signs the same request ID twice within the submitted signatures", async function () {
            // --- 準備階段 (Arrange) ---
            // 生成 M_threshold 個簽名，但其中有來自同一個授權中繼器的重複簽名
    
            const sigRelayer1 = await relayer1.signMessage(ethers.getBytes(messageHash));
            const signaturesArray = [sigRelayer1, sigRelayer1]; // 重複簽名
            
            // --- 操作斷言階段 (Act & Assert) ---
            // 斷言它會 revertedWith "BridgeContractB: Relayer has already signed this specific request"
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWith("BridgeContractB: Relayer has already signed this specific request");
        });
        
        it("Should revert if an invalid signature is provided (e.g., ecrecover fails)", async function () {
            // --- 準備階段 (Arrange) ---
            // 生成一組簽名，其中包含一個無效簽名，其餘 M-1 個來自授權中繼器
            const validSig = await relayer1.signMessage(ethers.getBytes(messageHash));
            let sigBytes = ethers.getBytes(validSig);
            // 修改 sigBytes 使其無效，例如更改 s 值
            sigBytes[64] = 5;
            const invalidSig = ethers.hexlify(sigBytes); // 生成一個隨機的無效簽名
            const signaturesArray = [validSig, invalidSig]; // 假設 M_threshold = 2
            // --- 操作並斷言階段 (Act & Assert) ---
            // 斷言它會 revertedWith "BridgeContractB: ECDSA signature recovery failed"
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWithCustomError(bridgeB, "ECDSAInvalidSignature");
        });
        it("Should revert if an invalid signature is provided (wrong length)", async function () {
            // --- 準備階段 (Arrange) ---
            // 生成一組簽名，其中包含一個無效簽名，其餘 M-1 個來自授權中繼器
            const validSig = await relayer1.signMessage(ethers.getBytes(messageHash));
            let sigBytes = ethers.getBytes(validSig);
            // 修改 sigBytes 使其無效，例如更改長度
            sigBytes = sigBytes.slice(0, 64); // 刪除最後一個字節，使其長度不正確
            const invalidSig = ethers.hexlify(sigBytes); // 生成一個隨機的無效簽名
            const signaturesArray = [validSig, invalidSig]; // 假設 M_threshold = 2
            // --- 操作並斷言階段 (Act & Assert) ---
            // 斷言它會 revertedWith "BridgeContractB: ECDSA signature recovery failed"
            await expect(bridgeB.connect(owner).executeCrossChainCommand(
                requestId,
                originalSender,
                recipient,
                sourceChainId,
                amount,
                commandCode,
                commandData,
                signaturesArray
            )).to.be.revertedWithCustomError(bridgeB, "ECDSAInvalidSignatureLength");
        });
    });
});