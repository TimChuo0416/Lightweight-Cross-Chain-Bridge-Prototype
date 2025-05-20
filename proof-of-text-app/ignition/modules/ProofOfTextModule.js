const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ProofOfTextModule", (m) => {
  // Deploy the ProofOfText contract
  const proofOfText = m.contract("ProofOfText");

  // Return the deployed contract instance (optional, but good practice)
  return { proofOfText };
});