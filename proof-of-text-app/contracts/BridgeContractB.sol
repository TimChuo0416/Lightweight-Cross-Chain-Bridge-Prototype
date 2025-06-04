// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // 與你的 hardhat.config.js 一致

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol"; // 用於簽名驗證

/**
 * @title BridgeContractB
 * @dev Target chain contract for the lightweight bridge.
 * Handles unlocking of assets (simulated for this demo) and emitting an event
 * with a command for the source chain.
 */



contract BridgeContractB is Ownable {
    // 合約的狀態變量和事件定義
    // using ECDSA for bytes32;
    // --- State Variables ---
    mapping(address => bool) public isRelayer; // 記錄授權的中繼器地址
    uint8 public M_threshold;                 // 需要的最小簽名數量
    mapping(bytes32 => bool) public processedRequestIds; // 防止重放攻擊
    mapping(bytes32 => mapping(address => bool)) public alreadySignedThisSpecificRequest; // 每個 requestId 和中繼器的簽名狀態

    // --- Events ---
    event CommandExecuted(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 amount,
        bytes1 commandCode,
        bytes commandData,
        string message
    );
    event RelayerAdded(address indexed relayer);
    // event MThresholdChanged(uint8 newM);      // 可選
    // --- Constructor ---
    // 修改構造函數以接收一個初始中繼器列表和 M 值
    constructor(address[] memory _initialRelayers, uint8 _initialMThreshold) Ownable(msg.sender) {
        require(_initialMThreshold > 0, "BridgeContractB: M_threshold must be greater than 0");
        require(_initialRelayers.length >= _initialMThreshold, "BridgeContractB: Number of initial relayers must be >= M_threshold");
        
        M_threshold = _initialMThreshold;

        for (uint256 i = 0; i < _initialRelayers.length; i++) {
            address relayer = _initialRelayers[i];
            require(relayer != address(0), "BridgeContractB: Invalid initial relayer address");
            require(!isRelayer[relayer], "BridgeContractB: Initial relayer address duplicated"); // 確保初始列表不重複
            isRelayer[relayer] = true;
            emit RelayerAdded(relayer); // 可選
        }
    }
    

    /**
     * @dev Validates a single signature and records it if valid.
     * Reverts if the signature is invalid.
     */
    function _validateAndRecordOneSignature(
        bytes32 _message,
        bytes32 _requestId,
        bytes memory _signature
    ) private { // private 或 internal，因為它會修改狀態
        address recoveredSigner = recoverSigner(_message, _signature);
        require(isRelayer[recoveredSigner], "BridgeContractB: Signer is not an authorized relayer");
        require(!alreadySignedThisSpecificRequest[_requestId][recoveredSigner], "BridgeContractB: Relayer has already signed this specific request");
        alreadySignedThisSpecificRequest[_requestId][recoveredSigner] = true;
    }

    // 其他函數和邏輯
    function executeCrossChainCommand(
        // Data from the original LockAssetAndSendCommand event on BridgeContractA
        bytes32 _requestId,         // The unique ID from the source chain event
        address _originalSender,    // The user who initiated the action on BridgeContractA
        address _recipient,         // The final recipient on this target chain
        uint256 _sourceChainId,     // The chain ID where the original event occurred (for context/verification)
        uint256 _amount,            // The amount from the original event
        bytes1 _commandCode,        // The command code from the original event
        bytes calldata _commandData,// The command data from the original event
        
        // Signatures from the M relayers
        bytes[] calldata _signatures // An array of signatures
    ) external {
        
        // 1. Replay Protection Check
        require(!processedRequestIds[_requestId], "BridgeContractB: Request already processed");
        processedRequestIds[_requestId] = true;

        // --- Message Reconstruction ---
        bytes32 messageHash = keccak256(abi.encodePacked(
            _requestId,
            _originalSender,
            _recipient,
            _sourceChainId,
            _amount,
            _commandCode,
            _commandData
        ));
        // --- TODO 3: M-of-N Signature Verification --
        uint8 validSignaturesCount = 0;
        for (uint256 i = 0; i < _signatures.length; i++) {
            // 如果 _validateAndRecordOneSignature 內部有任何 require 失敗，整個交易會 revert
            _validateAndRecordOneSignature(messageHash, _requestId, _signatures[i]);
            // Sucessful validation
            validSignaturesCount++;
            if (validSignaturesCount == M_threshold) {
                break;
            }
        }
        require(validSignaturesCount >= M_threshold, "BridgeContractB: Not enough valid signatures");
        // --- Command Execution ---
        emit CommandExecuted(
            _requestId,
            _recipient,
            _amount,
            _commandCode,
            _commandData,
            "Command executed successfully"
        );
    }

    function recoverSigner(bytes32 _messageHash, bytes memory _signature) internal pure returns (address) {

        bytes32 prefixedHash = MessageHashUtils.toEthSignedMessageHash(_messageHash);

        // ECDSA.recover 會處理 v, r, s 的解析，v 值的調整，並調用 ecrecover。
        // 如果簽名無效或 ecrecover 返回 address(0)，它會 revert。
        return ECDSA.recover(prefixedHash, _signature);
    }

    // --- Owner Functions for Relayer Management --- (保持你之前的實現)
    function addRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "BridgeContractB: Invalid relayer address");
        require(!isRelayer[_relayer], "BridgeContractB: Relayer already authorized");
        isRelayer[_relayer] = true;
        emit RelayerAdded(_relayer);
    }

    function removeRelayer(address _relayer) external onlyOwner {
        require(isRelayer[_relayer], "BridgeContractB: Relayer not authorized");
        isRelayer[_relayer] = false;
        // 可選: emit RelayerRemoved(_relayer);
    }

    function setMThreshold(uint8 _newM) external onlyOwner {
        require(_newM > 0, "BridgeContractB: M_threshold must be greater than 0");
        // require(_newM <= _relayerCount(), "BridgeContractB: M_threshold must be less than or equal to the number of relayers");
        M_threshold = _newM;
        // 可選: emit MThresholdChanged(_newM);
    }
}