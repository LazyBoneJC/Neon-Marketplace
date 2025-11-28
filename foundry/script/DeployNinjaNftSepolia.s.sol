// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {NinjaNft} from "../src/NinjaNft.sol";

contract DeployNinjaSepolia is Script {
    function run() external returns (NinjaNft) {
        vm.startBroadcast();
        NinjaNft ninja = new NinjaNft();
        vm.stopBroadcast();

        return ninja;
    }
}

// Script to deploy NinjaNft contract to Sepolia Testnet
// forge script script/DeployNinjaSepolia.s.sol \
//   --rpc-url $SEPOLIA_RPC_URL \
//   --private-key $PRIVATE_KEY \
//   --broadcast \
//   --verify \
//   --etherscan-api-key $ETHERSCAN_API_KEY \
//   --via-ir
