#!/bin/bash

# 🔧 设置和编译脚本 - ETHGlobal Buenos Aires

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 AI Berkshire Hathaway - 设置和编译脚本${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查 Foundry 是否安装
check_foundry() {
    if command -v forge &> /dev/null; then
        echo -e "${GREEN}✅ Foundry 已安装${NC}"
        forge --version
        return 0
    else
        echo -e "${YELLOW}⚠️ Foundry 未安装，正在安装...${NC}"
        return 1
    fi
}

# 安装 Foundry
install_foundry() {
    echo -e "${BLUE}📦 安装 Foundry...${NC}"
    curl -L https://foundry.paradigm.xyz | bash
    
    # 添加到 PATH
    export PATH="$HOME/.foundry/bin:$PATH"
    
    # 更新 Foundry
    foundryup
    
    if command -v forge &> /dev/null; then
        echo -e "${GREEN}✅ Foundry 安装成功${NC}"
        forge --version
    else
        echo -e "${RED}❌ Foundry 安装失败${NC}"
        exit 1
    fi
}

# 编译合约
compile_contracts() {
    echo -e "${BLUE}🔨 编译智能合约...${NC}"
    
    cd contracts/dca
    
    # 检查项目结构
    if [ ! -f "foundry.toml" ]; then
        echo -e "${RED}❌ 不是有效的 Foundry 项目${NC}"
        exit 1
    fi
    
    # 编译合约
    echo -e "${CYAN}$ forge build${NC}"
    
    if command -v forge &> /dev/null; then
        forge build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 合约编译成功${NC}"
            
            # 显示编译结果
            echo -e "${BLUE}📊 编译统计：${NC}"
            find out -name "*.json" | wc -l | xargs echo "   编译的合约数量:"
            
            # 检查关键合约
            if [ -f "out/SimplifiedDCAController.sol/SimplifiedDCAController.json" ]; then
                echo -e "${GREEN}✅ SimplifiedDCAController 编译成功${NC}"
            fi
            
            if [ -f "out/BaseDCAController.sol/BaseDCAController.json" ]; then
                echo -e "${GREEN}✅ BaseDCAController 编译成功${NC}"
            fi
            
        else
            echo -e "${RED}❌ 合约编译失败${NC}"
            echo -e "${YELLOW}💡 尝试解决方案：${NC}"
            echo "   1. 检查 Solidity 版本兼容性"
            echo "   2. 确认所有依赖已安装"
            echo "   3. 查看错误信息并修复语法问题"
            exit 1
        fi
    else
        echo -e "${RED}❌ forge 命令不可用${NC}"
        exit 1
    fi
    
    cd ../..
}

# 生成 ABI 文件
generate_abis() {
    echo -e "${BLUE}📄 生成 ABI 文件...${NC}"
    
    cd contracts/dca
    
    # 创建 ABI 目录
    mkdir -p ../../backend/src/abis
    
    # 提取主要合约的 ABI
    if [ -f "out/SimplifiedDCAController.sol/SimplifiedDCAController.json" ]; then
        cat out/SimplifiedDCAController.sol/SimplifiedDCAController.json | jq '.abi' > ../../backend/src/abis/SimplifiedDCAController.json
        echo -e "${GREEN}✅ SimplifiedDCAController ABI 已生成${NC}"
    fi
    
    if [ -f "out/BaseDCAController.sol/BaseDCAController.json" ]; then
        cat out/BaseDCAController.sol/BaseDCAController.json | jq '.abi' > ../../backend/src/abis/BaseDCAController.json
        echo -e "${GREEN}✅ BaseDCAController ABI 已生成${NC}"
    fi
    
    cd ../..
}

# 创建部署脚本
create_deploy_script() {
    echo -e "${BLUE}📝 创建部署脚本...${NC}"
    
    cat > contracts/dca/script/Deploy.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SimplifiedDCAController.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Base Sepolia addresses
        address usdc = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        address btcUsdPriceFeed = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
        address ccipRouter = 0xD3b06cEbF099CE7DA4AcCf578aaeFDBD6e73cEA2;
        address vrfCoordinator = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;
        
        // DCA configuration
        uint256[] memory thresholds = new uint256[](2);
        thresholds[0] = 85000 * 10**8; // $85,000
        thresholds[1] = 90000 * 10**8; // $90,000
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 * 10**6; // 100 USDC
        amounts[1] = 200 * 10**6; // 200 USDC
        
        SimplifiedDCAController dca = new SimplifiedDCAController(
            usdc,
            btcUsdPriceFeed,
            ccipRouter,
            vrfCoordinator,
            1, // VRF subscription ID
            0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c, // VRF key hash
            thresholds,
            amounts
        );
        
        vm.stopBroadcast();
        
        console.log("SimplifiedDCAController deployed to:", address(dca));
    }
}
EOF
    
    echo -e "${GREEN}✅ 部署脚本已创建${NC}"
}

# 主函数
main() {
    echo "开始设置和编译流程..."
    echo ""
    
    # 检查并安装 Foundry
    if ! check_foundry; then
        install_foundry
    fi
    
    # 编译合约
    compile_contracts
    
    # 生成 ABI
    if command -v jq &> /dev/null; then
        generate_abis
    else
        echo -e "${YELLOW}⚠️ jq 未安装，跳过 ABI 生成${NC}"
    fi
    
    # 创建部署脚本
    create_deploy_script
    
    echo ""
    echo -e "${GREEN}🎉 设置和编译完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 下一步操作：${NC}"
    echo "1. 🚀 部署合约: cd contracts/dca && forge script script/Deploy.s.sol --rpc-url \$BASE_SEPOLIA_RPC_URL --broadcast"
    echo "2. 🧪 运行测试: forge test"
    echo "3. 📊 查看 ABI: ls backend/src/abis/"
    echo ""
    echo -e "${YELLOW}💡 提示：${NC}"
    echo "   • 确保 .env 文件包含 PRIVATE_KEY"
    echo "   • 钱包需要有 Base Sepolia ETH"
    echo "   • 部署后更新 backend/src/config/chains.ts 中的合约地址"
}

# 运行主函数
main "$@"
