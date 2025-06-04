// relayer.js
const { ethers } = require("ethers"); // 注意：這裡直接導入 ethers，而不是從 hardhat 導入
const RELAYER_PRIVATE_KEYS = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat 帳戶 0
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",  // Hardhat 帳戶 1 (如果 M>=2)
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" // Hardhat 帳戶 2 (如果 M>=3)
];
const M_THRESHOLD = 2;  // M 的閾值，表示需要多少個 relayer 才能觸發事件
async function main() {
    // 連接到本地 Hardhat 節點
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
    

    // 獲取 BridgeContractA 的 ABI 和已部署地址
    const contractA_ABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_initialFee",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "FeesWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "requestId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "targetChainId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes1",
          "name": "commandCode",
          "type": "bytes1"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "commandData",
          "type": "bytes"
        }
      ],
      "name": "LockAssetAndSendCommand",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "UnlockEvent",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "bridgeFee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "currentRequestIdNonce",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_targetChainId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes1",
          "name": "_commandCode",
          "type": "bytes1"
        },
        {
          "internalType": "bytes",
          "name": "_commandData",
          "type": "bytes"
        }
      ],
      "name": "lockAssetAndSendCommand",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "pseudoLockedBalances",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "unlockPseudoAsset",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawFees",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }];
    const contractA_Address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // TODO 3: 創建 BridgeContractA 的合約實例
    //   - 提示: const bridgeA = new ethers.Contract(contractA_Address, contractA_ABI, provider);
    // YOUR CODE HERE for bridgeA contract instance
    const bridgeA = new ethers.Contract(contractA_Address, contractA_ABI, provider)
    if (!bridgeA) {
        console.error("[Relayer] 無法創建 BridgeContractA 實例。請檢查地址和 ABI 是否正確。");
        return;
    }

    console.log(`[Relayer] 連接到 BridgeContractA at ${await bridgeA.getAddress()}`);
    console.log("[Relayer] 開始監聽 LockAssetAndSendCommand 事件...");

    // TODO 4: 監聽 LockAssetAndSendCommand 事件
    //   - 提示: bridgeA.on("LockAssetAndSendCommand", (requestId, sender, recipient, targetChainId, amount, commandCode, commandData, event) => {
    //               console.log("\n[Relayer] 監聽到事件 LockAssetAndSendCommand!");
    //               // 在這裡處理事件數據 (TODO 5 及之後的步驟)
    //           });
    // YOUR CODE HERE for event listener
    bridgeA.on("LockAssetAndSendCommand", (...args) =>  {
        // 最後一個參數是 event object
        const event = args[args.length - 1];

        // 事件的參數應該在 event.args 中
        if (event && event.args) {
            const requestId = event.args.requestId;
            const sender = event.args.sender;
            const recipient = event.args.recipient;
            const targetChainId = event.args.targetChainId;
            const amount = event.args.amount;
            const commandCode = event.args.commandCode;
            const commandData = event.args.commandData;

            // console.log("  RequestId:", requestId);
            // console.log("  Sender (Source Chain):", sender);
            // console.log("  Recipient (Target Chain):", recipient);
            // console.log("  Target Chain ID:", targetChainId.toString());
            // console.log("  Amount:", ethers.formatEther(amount), "ETH (simulated)");
            // console.log("  Command Code:", commandCode);
            // // 對於 bytes 類型的 commandData，ethers.js v6 的 event.args 通常直接給出 hex string
            // console.log("  Command Data (hex):", commandData); 
            try {
                console.log("  Command Data (utf8):", ethers.toUtf8String(commandData));
            } catch (e) {
                console.log("  Command Data (utf8 conversion error):", e.message);
            }
            // 構造 messageHash，確保類型和順序與 BridgeContractB.sol 中的 abi.encodePacked 完全一致
            const types = ["bytes32", "address", "address", "uint256", "uint256", "bytes1", "bytes"];
            const values = [
                requestId,
                sender,    // 來自事件的 sender，即 BridgeContractB 中的 _originalSender
                recipient, // 來自事件的 recipient
                targetChainId, // 來自事件的 targetChainId，即 BridgeContractB 中的 _sourceChainId
                amount,
                commandCode,
                commandData // commandData 在事件中通常是 hex string，ethers.solidityPackedKeccak256 可以處理
            ];
            const messageHash = ethers.solidityPackedKeccak256(types, values);
            console.log("  [Relayer] 構造的 messageHash:", messageHash);
        } else {
            console.log("  無法獲取 event.args。收到的參數:");
            args.forEach((arg, index) => {
                console.log(`    arg[${index}]:`, arg);
            });
        }
    });

    // 讓腳本持續運行以監聽事件
    // 在真實的中繼器中，這裡會有一個更健壯的持續運行和錯誤處理機制
    // 對於本地 Demo，我們可以讓它在這裡等待，或者你可以設計一個退出條件
    // process.stdin.resume(); // 一個簡單的方法讓腳本不立即退出
    console.log("[Relayer] 按下 Ctrl+C 來停止中繼器。");
    // 為了讓事件監聽器有時間工作，我們可以创建一个永远不会 resolve 的 Promise
    await new Promise(() => {}); 
}

main().catch((error) => {
    console.error("[Relayer] 發生錯誤:", error);
    process.exitCode = 1;
});