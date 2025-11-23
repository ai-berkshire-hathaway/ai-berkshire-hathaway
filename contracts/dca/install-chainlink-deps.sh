#!/bin/bash

# 安装 Chainlink 合约依赖

echo "🔗 Installing Chainlink contract dependencies..."

# 安装 Chainlink Brownie Contracts (包含 VRF, Price Feeds)
echo "📦 Installing Chainlink Brownie Contracts..."
git submodule add https://github.com/smartcontractkit/chainlink-brownie-contracts lib/chainlink-brownie-contracts

# 安装 CCIP 合约
echo "📦 Installing Chainlink CCIP..."
git submodule add https://github.com/smartcontractkit/ccip lib/ccip

# 安装 OpenZeppelin (通常需要)
echo "📦 Installing OpenZeppelin Contracts..."
git submodule add https://github.com/OpenZeppelin/openzeppelin-contracts lib/openzeppelin-contracts

echo "✅ Dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Run: forge build"
echo "2. If build fails, check remappings in foundry.toml"
