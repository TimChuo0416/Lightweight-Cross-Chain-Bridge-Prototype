// SPDX-License-Identifier: MIT
// Specifies the license for the contract (use MIT for open source)
pragma solidity ^0.8.20; // Specifies the Solidity compiler version (use a recent one supported by Hardhat)

/**
 * @title ProofOfText
 * @dev A simple contract to store a string message associated with a user address.
 * Mimics the basic record-keeping aspect of a cross-chain message bridge MVP.
 */
contract ProofOfText {
    // State variable: Mapping from user address to their last stored message
    mapping(address => string) private userMessages;

    // Event: Emitted when a message is successfully locked by a user
    event MessageLocked(address indexed user, string message, uint value);

    /**
     * @notice Stores or updates a text message for the caller (msg.sender).
     * @dev Associates the input text with the sender's address in the userMessages mapping.
     * Emits a MessageLocked event upon successful storage.
     * Is payable, allowing ETH to be sent along, though it's not used in this simple version.
     * @param text The string message to be stored.
     */
    function lockMessage(string calldata text) external payable {
        address sender = msg.sender; // Get the address of the function caller
        userMessages[sender] = text; // Store the text, overwriting any previous message from this sender

        // Emit an event to log the action on the blockchain
        emit MessageLocked(sender, text, msg.value); // msg.value is the amount of ETH sent with the transaction
    }

    /**
     * @notice Retrieves the last message stored by a specific user.
     * @dev Reads from the userMessages mapping for the given user address.
     * This is a view function, meaning it doesn't cost gas to call from off-chain and doesn't modify state.
     * @param user The address of the user whose message to retrieve.
     * @return string The last message stored by the user. Returns an empty string if the user never stored a message.
     */
    function getMessage(address user) external view returns (string memory) {
        return userMessages[user]; // Return the message associated with the user address
    }
}