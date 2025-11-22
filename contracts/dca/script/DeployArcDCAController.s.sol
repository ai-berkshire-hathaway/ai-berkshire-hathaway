// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ArcDCAController} from "../src/ArcDCAController.sol";

contract DeployArcDCAController is Script {
    function run() external {
        // 1. 从环境变量读取配置
        address usdc = vm.envAddress("ARC_USDC_ADDRESS");
        address pyth = vm.envAddress("ARC_PYTH_ADDRESS");
        bytes32 btcUsdPriceId = vm.envBytes32("BTC_USD_PRICE_ID");

        // 2. 在函数内部声明 thresholds 和 amounts（关键！）
        //    注意：一定要有这一行声明，后面才能用 thresholds[0] 之类
        uint256[] memory thresholds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);

        // thresholds 用 USD * 10^2，比如 85000.00 USD => 8_500_000
        thresholds[0] = 85_000_00; // 85000.00 USD
        thresholds[1] = 82_000_00; // 82000.00 USD
        thresholds[2] = 79_000_00; // 79000.00 USD

        // 每档定投 5 USDC（USDC 6 decimals => 5 * 10^6）
        amounts[0] = 5_000_000; // 5 USDC
        amounts[1] = 5_000_000; // 5 USDC
        amounts[2] = 5_000_000; // 5 USDC

        // 3. 发起交易部署合约
        vm.startBroadcast();

        ArcDCAController controller = new ArcDCAController(
            usdc,
            pyth,
            btcUsdPriceId,
            thresholds,
            amounts
        );

        vm.stopBroadcast();

        // 想打印的话再加上下面两行，并在上面 import console2:
        // import {console2} from "forge-std/console2.sol";
        // console2.log("ArcDCAController deployed at", address(controller));
    }
}