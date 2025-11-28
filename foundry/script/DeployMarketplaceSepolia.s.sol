// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {NftMarketplace} from "../src/NftMarketplace.sol";

contract DeployMarketplace is Script {
    function run() external returns (NftMarketplace) {
        // 這是你剛剛部署成功的 Sepolia MockUSDC 地址
        address usdcAddress = 0xb51adb70bE6018888f5df053E0B9FE4C4C57d85c;

        vm.startBroadcast();
        // 直接把地址傳進去
        NftMarketplace marketplace = new NftMarketplace(usdcAddress);
        vm.stopBroadcast();

        return marketplace;
    }
}

// Script to deploy Marketplace contract to Sepolia Testnet
// forge script script/DeployMarketplace.s.sol \
//   --rpc-url $SEPOLIA_RPC_URL \
//   --private-key $PRIVATE_KEY \
//   --broadcast \
//   --verify \
//   --etherscan-api-key $ETHERSCAN_API_KEY
