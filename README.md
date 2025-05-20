# 期末專案：輕量級基於預言機的跨鏈橋原型 (Lightweight Oracle-Based Cross-Chain Bridge Prototype)

**作者 (Author):** 卓岳霆 (Yueh-Ting Chuo)
**學號 (Student ID):** 110062236
**Email:** timchuo03@gmail.com
**GitHub Repository:** [你的 GitHub Repo 連結]
**期末專案進度報告 (Progress Report):** [./Final_Project_Progress_Report.pdf](Final_Project_Progress_Report.pdf)

## 專案概述 (Project Overview)

本專案旨在研究並設計一個**輕量級的基於預言機/中繼器 (Oracle/Relayer) 的跨鏈橋原型**。當前區塊鏈生態系統面臨著互操作性的挑戰，現有的跨鏈解決方案往往伴隨著高延遲和實作複雜性等問題。本專案提出的原型利用**授權預言機節點群 (Authorized Oracle/Relayer Nodes)** 和**數位簽章 (Digital Signatures)** 進行跨鏈訊息驗證，目標是顯著降低端對端延遲並簡化部署流程，特別是與完全去信任化的輕客戶端協議相比。

## 動機 (Motivation)

隨著獨立區塊鏈網絡的興起，資產、用戶和流動性分散在不同的生態系統中，形成了所謂的「區塊鏈孤島」。高效且安全的跨鏈橋接對於實現統一的 Web3 至關重要。高延遲和複雜性不僅影響用戶體驗（尤其是在 DeFi 等時間敏感領域），也增加了開發和審計的成本與風險。因此，本專案致力於探索一種能夠同時優化延遲和實作複雜性的跨鏈橋設計。

## 核心設計與工作流程 (Core Design & Workflow)

本專案提出的跨鏈橋原型，其核心假設是通過驗證 M-of-N 授權中繼器的簽名及重放保護機制，可以在保證特定場景（如聯盟鏈或學術原型）可接受安全性的前提下，大幅提升效率並降低複雜度。

**主要流程如下：**

1.  **源鏈 (Source Chain - BridgeContract_A)：**
    * 用戶與 `BridgeContract_A` 互動，鎖定 (Lock) 或銷毀 (Burn) 其資產（例如 Token）。
    * `BridgeContract_A` 觸發一個包含交易請求 ID 和相關負載 (payload) 的 `LockEvent` 事件。
2.  **授權中繼器/預言機 (Authorized Relayers/Oracles)：**
    * 一組被授權的中繼器節點監聽源鏈上的 `LockEvent` 事件。
    * 等待源鏈達到一定的區塊確認數（例如，k 個 PoS 週期的確認）以確保事件的準最終性。
    * 中繼器構建包含事件數據的訊息 `m`（通常是事件數據的哈希）。
    * 至少 M 個（共 N 個）授權中繼器對訊息 `m` 進行共簽 (Co-Sign)。
3.  **目標鏈 (Destination Chain - BridgeContract_B)：**
    * 中繼器將包含共簽簽名的訊息提交給目標鏈上的 `BridgeContract_B`。
    * `BridgeContract_B` 驗證 M-of-N 簽名的有效性。
    * `BridgeContract_B` 檢查並更新重放保護映射 (Replay-Protection Mapping)，防止同一訊息被重複處理。
    * 驗證通過後，`BridgeContract_B` 向指定接收者鑄造 (Mint) 或釋放 (Release) 相應的資產。

**預期效益：**
* **更快的結算速度：** 目標 P95 延遲小於 10 秒。
* **更簡潔的代碼：** 無需複雜的輕客戶端邏輯，核心合約代碼量預計約 1.9k LoC。
* **易於部署：** 任何 EVM 兼容鏈只需白名單一組公鑰即可啟用橋接，無需修改共識。
* **有界信任安全：** 安全性依賴於中繼器群體的誠實性，可通過 Staking/Slashing 機制和暫停開關來降低勾結風險。

**(可在此處嵌入你的流程圖： `![Bridge Workflow](research-and-design/Bridge_Workflow_Diagram.png)` )**

## 技術驗證雛形 (Proof-of-Concept DApp - ProofOfText)

為了驗證上述跨鏈橋設計中的核心「訊息鎖定與查詢」機制，以及熟悉相關的智能合約開發、測試和部署流程，我獨立開發了一個名為 **ProofOfText** 的去中心化應用程式 (DApp)。

* **功能：** 允許用戶通過 MetaMask 錢包在 Sepolia 測試網上鎖定 (記錄) 一段文字訊息，並能查詢自己最近一次鎖定的訊息。
* **技術棧：**
    * 智能合約：Solidity
    * 開發框架：Hardhat (包含 Mocha 和 Chai 用於測試)
    * 前端：HTML, CSS, JavaScript
    * 以太坊庫：ethers.js (v6)
    * 部署：合約部署於 Sepolia 測試網，前端部署於 Netlify。
* **詳細資訊和運行指南：** 請參閱 [`./proof-of-text-dapp/README.md`](./proof-of-text-dapp/README.md)
* **線上演示 (Netlify)：** [你的 ProofOfText DApp Netlify 連結]
* **Sepolia 合約地址：** `0x87f728AdA36c5A35C9D69466F765aa7998F8e3D5`
* **Etherscan 連結：** [https://sepolia.etherscan.io/address/0x87f728AdA36c5A35C9D69466F765aa7998F8e3D5](https://sepolia.etherscan.io/address/0x87f728AdA36c5A35C9D69466F765aa7998F8e3D5)

## 專案進度與未來工作 (Current Progress & Future Work)

詳細的專案進度、已完成的文獻調研、更細緻的設計考量以及未來的開發和評估計劃，請參閱完整的**[期末專案進度報告 (Final Project Progress Report)](./Final_Project_Progress_Report_110062236.pdf)**。

**主要進度概覽：**

* 文獻回顧：已完成
* 原型設計：已完成 80%
* Hardhat 環境設定：已完成
* 核心合約 (A/B) 編寫：進行中 (約 30%)
* 中繼器腳本開發：進行中 (約 30%)
* ... (其他根據你報告中的表格)

**未來工作重點：**

1.  **原型實作：** 完成核心智能合約 (BridgeContractA, BridgeContractB) 和基礎的授權中繼器腳本開發。
2.  **測試與調試：** 進行合約單元測試和本地端對端集成測試。
3.  **功能演示準備：** 準備可靠演示原型核心跨鏈轉帳功能的腳本和流程。
4.  **評估執行：** 在本地環境中測量端對端延遲，進行複雜性評估和安全性分析。
5.  **完成期末報告：** 彙總設計、實作、演示過程、評估結果、分析與結論。

## 如何運行/測試 (How to Run/Test)

**1. ProofOfText DApp (雛形驗證)：**

   請參閱 [`./proof-of-text-dapp/README.md`](./proof-of-text-dapp/README.md) 中的詳細步驟。

**2. 跨鏈橋原型 (核心功能 - 開發中)：**

   *(此部分待核心合約和中繼器腳本開發到一定程度後補充具體測試步驟)*

## 技術棧 (Tech Stack)

* **智能合約：** Solidity
* **開發與測試框架：** Hardhat, Mocha, Chai
* **以太坊交互庫：** ethers.js
* **前端：** HTML, CSS, JavaScript
* **錢包：** MetaMask
* **測試網路：** Sepolia
* **前端部署：** Netlify
* **(未來可能涉及中繼器部分)：** Node.js, etc.

## 聯繫方式 (Contact)

卓岳霆 (Yueh-Ting Chuo) - timchuo03@gapp.nthu.edu.tw