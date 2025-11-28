// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {NinjaNft} from "../src/NinjaNft.sol";
import {NftMarketplace} from "../src/NftMarketplace.sol";

contract MintAndListNinja is Script {
    // Fill these in if needed!
    address s_ninjaAddress;
    address s_marketplaceAddress;

    function mintAndListNinja(address ninjaAddress, address marketplaceAddress) public {
        NinjaNft ninja = NinjaNft(ninjaAddress);
        NftMarketplace marketplace = NftMarketplace(marketplaceAddress);

        vm.startBroadcast();

        uint256 tokenId = ninja.mintNinja();
        console.log(tokenId);
        ninja.approve(marketplaceAddress, tokenId);
        marketplace.listItem(ninjaAddress, tokenId, 10e6);

        vm.stopBroadcast();
    }

    function justMintNinja(address ninjaAddress) public {
        NinjaNft ninja = NinjaNft(ninjaAddress);

        vm.startBroadcast();

        ninja.mintNinja();

        vm.stopBroadcast();
    }

    function run() external {
        mintAndListNinja(s_ninjaAddress, s_marketplaceAddress);
    }
}
