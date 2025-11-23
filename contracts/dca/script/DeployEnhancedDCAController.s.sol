// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {EnhancedDCAController} from "../src/EnhancedDCAController.sol";

contract DeployEnhancedDCAController is Script {
    function run() external {
        // 1. 从环境变量读取配置
        address usdc = vm.envAddress("USDC_ADDRESS");
        address btcUsdPriceFeed = vm.envAddress("BTC_USD_PRICE_FEED");
        address ccipRouter = vm.envAddress("CCIP_ROUTER");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        uint64 vrfSubscriptionId = uint64(vm.envUint("VRF_SUBSCRIPTION_ID"));
        bytes32 vrfKeyHash = vm.envBytes32("VRF_KEY_HASH");

        // 2. 在函数内部声明 thresholds 和 amounts（关键！）
        //    注意：一定要有这一行声明，后面才能用 thresholds[0] 之类
        uint256[] memory thresholds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);

        // thresholds 用 USD * 10^8 (Chainlink price feed 8 decimals)
        // 比如 85000.00 USD => 85000 * 10^8
        thresholds[0] = 86000 * 10**8; // 85000.00 USD
        thresholds[1] = 82000 * 10**8; // 82000.00 USD
        thresholds[2] = 79000 * 10**8; // 79000.00 USD

        // 每档定投 5 USDC（USDC 6 decimals => 5 * 10^6）
        amounts[0] = 5 * 10**6; // 5 USDC
        amounts[1] = 5 * 10**6; // 5 USDC
        amounts[2] = 5 * 10**6; // 5 USDC

        // 3. 发起交易部署合约
        vm.startBroadcast();

        EnhancedDCAController controller = new EnhancedDCAController(
            usdc,
            btcUsdPriceFeed,
            ccipRouter,
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash,
            thresholds,
            amounts
        );

        vm.stopBroadcast();

        // 打印部署地址
        console.log("EnhancedDCAController deployed at:", address(controller));
        console.log("Constructor parameters:");
        console.log("  USDC:", usdc);
        console.log("  BTC/USD Price Feed:", btcUsdPriceFeed);
        console.log("  CCIP Router:", ccipRouter);
        console.log("  VRF Coordinator:", vrfCoordinator);
        console.log("  VRF Subscription ID:", vrfSubscriptionId);
        console.logBytes32(vrfKeyHash);
    }
}
