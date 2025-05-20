# CS5363 - Hw8: ProofOfText DApp

這是一個簡易的去中心化應用程式 (DApp)，用於在 Sepolia 測試網路上記錄和查詢文字訊息。它是 CS5363 課程期末專案的一個最小可行產品 (MVP)。
此README由AI輔助撰寫。

**DApp 公開訪問網址**: [https://6822dadc90e0efe3da2a4ed3--resplendent-crumble-0300db.netlify.app/]
(https://6822dadc90e0efe3da2a4ed3--resplendent-crumble-0300db.netlify.app/)
*(請使用 MetaMask 並連接到 Sepolia 測試網路進行互動)*

**Sepolia 合約地址**: \`\`
**Etherscan 連結**: [https://sepolia.etherscan.io/address/](https://sepolia.etherscan.io/address/)

## 專案結構概述

* `contracts/ProofOfText.sol`: 智能合約源碼。
* `frontend/`: 包含 DApp 前端 (`index.html`, `style.css`, `index.js`)。
* `ignition/modules/ProofOfTextModule.js`: Hardhat Ignition 部署模組。
* `test/ProofOfText.test.js`: 合約單元測試。
* `hardhat.config.js`: Hardhat 設定檔。
* `.env`: (Git 忽略) 儲存 RPC URL 和私鑰。
* `Hw8_Report.docx`: 詳細的 Word 報告。

## 1. 開發環境需求

* **Node.js**: \`\`
* **npm**: \`\`
* **Hardhat**: \`\`
* **MetaMask**: 瀏覽器擴充錢包。

## 2. 安裝與設定

1. **安裝依賴**:

   ```bash
   npm install
   ```
2. **設定環境變數**:

   * 建立 `.env` 檔案，並填入以下內容，替換為實際值：

     ```env
     SEPOLIA_RPC_URL="YOUR_SEPOLIA_RPC_URL"
     PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY_FOR_DEPLOYMENT"
     ```


## 3. 測試合約

```bash
npx hardhat test
```

## 4. 本地運行 DApp (開發測試)

1. **啟動本地節點**:

   ```bash
   npx hardhat node
   ```
2. **部署至本地節點**:

   ```bash
   npx hardhat ignition deploy ./ignition/modules/ProofOfTextModule.js --network localhost
   ```
3. **更新前端配置**: 修改 `frontend/index.js` 的 `contractAddress`。
4. **運行前端**: 打開 `frontend/index.html`。
5. **設定 MetaMask**: 連接至本地Hardhat網路 (`http://127.0.0.1:8545`, Chain ID: `31337`)。

## 5. 發布與部署 (公開測試網)

### 智能合約 (Sepolia)

1. 確認`.env`配置正確。
2. 部署合約至Sepolia:

   ```bash
   npx hardhat ignition deploy ./ignition/modules/ProofOfTextModule.js --network sepolia
   ```

### 前端 DApp (Netlify)

1. 更新`frontend/index.js`的合約地址。
2. 使用[Netlify Drop](https://app.netlify.com/drop)部署`frontend/`。

## 7. DApp 功能

* **連接錢包**: 使用 MetaMask 連接Sepolia網路。
* **鎖定訊息**: 輸入訊息並上鏈。
* **查詢訊息**: 查詢最近一次記錄的訊息。
