// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {NinjaNft} from "../src/NinjaNft.sol";

contract DeployNinjaNft is Script {
    function deployNinja() public returns (NinjaNft) {
        vm.startBroadcast();
        NinjaNft ninja = new NinjaNft();
        vm.stopBroadcast();
        return ninja;
    }

    function run() external returns (address) {
        NinjaNft ninja = deployNinja();
        return address(ninja);
    }
}
