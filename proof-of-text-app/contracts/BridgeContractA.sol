// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BridgeContractA
 * @dev Source chain contract for the lightweight bridge.
 * Handles locking of assets (simulated for this demo) and emitting an event
 * with a command for the target chain.
 */
contract BridgeContractA is Ownable {

    uint256 public currentRequestIdNonce; // Used to generate unique request IDs
    mapping(address => uint256) public pseudoLockedBalances;
    // address public immutable mockTokenAddress; // 模擬一個特定的ERC20代幣
    
    uint256 public bridgeFee;

    // --- Events ---
    event LockAssetAndSendCommand(
        bytes32 indexed requestId,    // Unique ID for the request
        address indexed sender,       // User initiating the lock/send
        address recipient,            // Recipient address on the target chain
        uint256 targetChainId,      // ID of the target chain
        uint256 amount,             // Amount of (pseudo) asset locked
        bytes1 commandCode,         // Code for the command to be executed on the target chain
        bytes commandData           // Additional data for the command
    );

    
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event UnlockEvent(address indexed user, uint256 amount); // 可選事件，用於解鎖模擬資產

    // --- Constructor ---
    constructor(uint256 _initialFee) Ownable(msg.sender){
        bridgeFee = _initialFee;
    }

    // --- Functions ---

    /**
     * @notice Locks a (pseudo) asset and emits an event to send a command to the target chain.
     * @param _recipient Recipient address on the target chain.
     * @param _targetChainId ID of the target blockchain.
     * @param _amount Amount of the asset to lock (simulated).
     * @param _commandCode A 1-byte code for the command.
     * @param _commandData Arbitrary data for the command.
     */
    function lockAssetAndSendCommand(
        address _recipient,
        uint256 _targetChainId,
        uint256 _amount,
        bytes1 _commandCode, // 1-byte command code
        bytes calldata _commandData // Arbitrary data for the command
    ) external payable { // 'payable' if your bridge design includes fees paid on the source chain

        // 實現 requestId 的生成邏輯
        
        require(msg.value >= bridgeFee, "BridgeContractA: Insufficient fee provided");

        bytes32 requestId = keccak256(abi.encodePacked(block.chainid, address(this), msg.sender, _recipient, _targetChainId, _amount, _commandCode, _commandData,currentRequestIdNonce));
        currentRequestIdNonce++;


        // TODO: 2. (可選) 實現模擬資產鎖定的邏輯
        //    - 如果你選擇實現 pseudoLockedBalances，在這裡更新它。
        //    - 可以添加一些 require 語句來檢查輸入，例如 _amount > 0。
        require(msg.sender != address(0), "BridgeContractA: Invalid sender");
        require(_amount > 0, "BridgeContractA: Amount must be greater than 0");
        pseudoLockedBalances[msg.sender] += _amount; // 示例


        // 3. 觸發事件
        emit LockAssetAndSendCommand(
            requestId,
            msg.sender,
            _recipient,
            _targetChainId,
            _amount,
            _commandCode,
            _commandData
        );

        // TODO: 4. (可選) 如果此函數是 payable 並且橋接操作需要費用，
        //    可以在這裡處理 msg.value。例如，將費用轉移到合約的owner或資金池。
        
    }

    function withdrawFees() external onlyOwner { 
        uint256 balance = address(this).balance;
        require(balance > 0, "BridgeContractA: No fees to withdraw");
        (bool success, ) = owner().call{value: balance}(""); 
        require(success, "BridgeContractA: Fee withdrawal failed");
        emit FeesWithdrawn(owner(), balance); // 可選事件
    }

    // TODO: (可選) 添加一個函數來讓用戶（或合約所有者）提取/解鎖之前鎖定的模擬資產
    //       （如果實現了 pseudoLockedBalances）。這對於完整的模擬流程會比較好。
    
    function unlockPseudoAsset(uint256 _amount) external {
        require(pseudoLockedBalances[msg.sender] >= _amount, "BridgeContractA: Insufficient locked balance");
        pseudoLockedBalances[msg.sender] -= _amount;
        // 可以選擇性地觸發一個 UnlockEvent
        emit UnlockEvent(msg.sender, _amount); 
    }
}