// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/Penny.sol";

/**
 * Deploy Penny.
 *
 * env:
 *   PRIVATE_KEY      — deployer
 *   CUSD_ADDRESS     — cUSD on the target chain
 *   TREASURY_ADDRESS — LLM operator address that collects message costs
 *   RELAY_ADDRESS    — off-chain relay that registers + confirms messages
 *   BADGE_BASE_URI   — optional metadata gateway
 *
 * Tier seed: HAIKU (0.001 cUSD), SONNET (0.005 cUSD), OPUS (0.020 cUSD).
 */
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address cUSDAddress = vm.envAddress("CUSD_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address relay = vm.envAddress("RELAY_ADDRESS");
        string memory baseURI = vm.envOr("BADGE_BASE_URI", string(""));

        vm.startBroadcast(pk);

        Penny p = new Penny(IERC20(cUSDAddress), treasury, relay);

        // seed canonical tiers — owner can update later via updateTier
        p.registerTier(bytes32("haiku-4-5"),  uint128(0.001 ether));
        p.registerTier(bytes32("sonnet-4-6"), uint128(0.005 ether));
        p.registerTier(bytes32("opus-4-7"),   uint128(0.020 ether));

        if (bytes(baseURI).length > 0) {
            p.setBaseURI(baseURI);
        }

        vm.stopBroadcast();

        console2.log("Penny:", address(p));
        console2.log("cUSD:", cUSDAddress);
        console2.log("treasury:", treasury);
        console2.log("relay:", relay);
    }
}
