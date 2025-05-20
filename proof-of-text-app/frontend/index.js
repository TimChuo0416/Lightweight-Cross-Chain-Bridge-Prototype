
// const connectButton = document.getElementById('connect');
const lockButton = document.getElementById('lock');
const messageInput = document.getElementById('msg');
const getButton = document.getElementById('get'); 
const statusDiv = document.getElementById('status');
const retrievedMessageDiv = document.getElementById('retrievedMessage'); 


const contractAddress = "0x87f728AdA36c5A35C9D69466F765aa7998F8e3D5";
// ABI (Application Binary Interface) - Describes how to interact with the contract
// You can get this from artifacts/contracts/ProofOfText.sol/ProofOfText.json after compiling

const contractABI = [
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
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "MessageLocked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getMessage",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "text",
          "type": "string"
        }
      ],
      "name": "lockMessage",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ]; // Using Human-Readable ABI format for simplicity


let provider; // MetaMask provider
let signer;   // User's wallet account
let contract; // Ethers.js contract instance


// Function to connect to MetaMask
async function connectWallet() {
    statusDiv.textContent = 'Connecting to MetaMask...';
    statusDiv.className = ''; // 清除舊的 class
    lockButton.disabled = true; // 連接過程中先禁用按鈕

    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            // Create Ethers provider from MetaMask provider
            provider = new ethers.BrowserProvider(window.ethereum);
            // Get the signer (account) (v6 - now async)
            signer = await provider.getSigner();
            // Get the connected account address
            const userAddress = await signer.getAddress();

            // Instantiate the contract
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            statusDiv.textContent = `Wallet connected: ${userAddress}. Ready to interact.`;
            statusDiv.className = 'success'; // **新增**: 連接成功，設為 success class
            lockButton.disabled = false; // Enable button after connection
            // Optional: Automatically get the user's last message upon connection
            // displayUserMessage();
        } catch (error) {
            console.error("User rejected connection or error:", error);
            statusDiv.textContent = `Connection failed: ${error.message}. Please ensure you are on the Hardhat Local network.`;
            statusDiv.className = 'error';
            lockButton.disabled = true;
        }
    } else {
        statusDiv.textContent = 'MetaMask is not installed. Please install MetaMask and refresh.';
        statusDiv.className = 'error';
        lockButton.disabled = true;
    }
}

// Function to call lockMessage contract function
async function handleLockMessage() {
    const messageText = messageInput.value;
    if (!messageText) {
        statusDiv.textContent = 'Please enter a message to lock.';
        statusDiv.className = 'error'; 
        return;
    }
    if (!contract) {
        statusDiv.textContent = 'Please connect your wallet first.';
        statusDiv.className = 'error'; 
        return;
    }

    statusDiv.textContent = `Locking message "${messageText}"... (Waiting for transaction confirmation)`;
    statusDiv.className = 'pending';
    lockButton.disabled = true; // Disable button during transaction

    try {
        // Send the transaction to the contract's lockMessage function
        // Include a small amount of ETH (e.g., 0.001 ETH) as defined in the contract test
        const txValue = ethers.parseEther("0.001");
        const tx = await contract.lockMessage(messageText, { value: txValue });

        statusDiv.textContent = `Transaction sent! Waiting for confirmation... Tx Hash: ${tx.hash}`;
        statusDiv.className = 'pending';

        // Wait for the transaction to be mined (1 confirmation)
        await tx.wait(1);

        statusDiv.textContent = `Message "${messageText}" locked successfully! Transaction confirmed.`;
        statusDiv.className = 'success';
        messageInput.value = ''; // Clear input field
        // Optional: Refresh displayed message after locking
        // displayUserMessage();

    } catch (error) {
        console.error("Error locking message:", error);
        // Try to extract a revert reason if available
        let errorMessage = error.message;
        if (error.data?.message) { // Check standard JSON-RPC error data
            errorMessage = error.data.message;
        } else if (error.reason) { // Check ethers.js specific reason
            errorMessage = error.reason;
        }
        statusDiv.textContent = `Error locking message: ${errorMessage}`;
        statusDiv.className = 'error';
    } finally {
        lockButton.disabled = false; // Re-enable button
    }
}

// Function to display the current user's message (Optional, called on connect/lock)
async function displayUserMessage() {
  if (!contract || !signer) return;
  try {
      const userAddress = await signer.getAddress();
      const message = await contract.getMessage(userAddress);
      if (message) {
          // Append to status or replace, depending on desired UI
          statusDiv.textContent += `\nYour last locked message: ${message}`;
      } else {
          statusDiv.textContent += `\nYou haven't locked any message yet.`;
      }
  } catch (error) {
      console.error("Error fetching message:", error);
      // Handle error silently or display a specific error message
  }
}


async function handleGetMessage() {
    retrievedMessageDiv.textContent = 'Fetching message...'; // 顯示讀取中
    retrievedMessageDiv.className = ''; // 清除舊樣式

    if (!contract || !signer) {
        retrievedMessageDiv.textContent = 'Please connect your wallet first.';
        retrievedMessageDiv.className = 'error'; // 用 error class 顯示錯誤
        return;
    }

    try {
        // 獲取當前連接的地址
        const userAddress = await signer.getAddress();
        // 呼叫合約的 getMessage 函式 (這是 view call，不需交易)
        const message = await contract.getMessage(userAddress);

        if (message) {
            retrievedMessageDiv.textContent = `Your last message: ${message}`;
            retrievedMessageDiv.className = 'success'; // 用 success class 顯示成功
        } else {
            retrievedMessageDiv.textContent = `You haven't locked any message yet.`;
            retrievedMessageDiv.className = 'info'; // 可以定義一個 info class 或保持預設
        }
    } catch (error) {
        console.error("Error fetching message:", error);
        retrievedMessageDiv.textContent = `Error fetching message: ${error.message}`;
        retrievedMessageDiv.className = 'error'; // 用 error class 顯示錯誤
    }
}



window.addEventListener('load', () => {
    // 設定初始狀態文字和樣式
    statusDiv.textContent = 'Initializing... Please connect your MetaMask wallet (Hardhat Local network).';
    statusDiv.className = ''; // 初始無特殊 class
    lockButton.disabled = true; // 初始禁用按鈕
    // 然後嘗試連接錢包
    connectWallet();
});



lockButton.addEventListener('click', handleLockMessage);
getButton.addEventListener('click', handleGetMessage);


if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts);
      // Re-connect or update UI when account changes
      connectWallet();
  });


  window.ethereum.on('chainChanged', (chainId) => {
      console.log('Network changed:', chainId);
      // Prompt user to switch back to Hardhat network or handle accordingly
      statusDiv.textContent = 'Network changed. Please ensure you are on the Hardhat Local network (Chain ID 31337).';
      connectWallet(); // Re-check connection status
  });
}