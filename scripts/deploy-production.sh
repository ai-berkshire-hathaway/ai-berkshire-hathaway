#!/bin/bash

# AI Berkshire Hathaway - 生产环境部署脚本
# Base 主网 DCA 策略：BTC < 8.5万/8.2万/7.9万 时定投 5 USDC

set -e

echo "🚀 AI Berkshire Hathaway - 生产环境部署"
echo "========================================"

# 检查必要的环境变量
if [ -z "$CRE_ETH_PRIVATE_KEY" ]; then
    echo "❌ 错误: CRE_ETH_PRIVATE_KEY 环境变量未设置"
    echo "请设置你的私钥用于 CRE 工作流部署"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: OPENAI_API_KEY 环境变量未设置"
    echo "请设置 OpenAI API 密钥用于 AI 市场分析"
    exit 1
fi

# 检查合约地址是否已配置
if [ -z "$BASE_DCA_CONTROLLER_ADDRESS" ]; then
    echo "⚠️  警告: BASE_DCA_CONTROLLER_ADDRESS 未设置"
    echo "请先部署 DCA 控制器合约到 Base 主网"
    echo ""
    echo "需要部署的合约："
    echo "1. EnhancedDCAController.sol"
    echo "2. ReserveManager.sol"
    echo "3. BalanceReader.sol"
    echo "4. MessageEmitter.sol"
    echo ""
    read -p "是否继续部署工作流? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📋 部署配置检查："
echo "=================="
echo "🌐 网络: Base 主网"
echo "⏰ 执行频率: 每 10 分钟"
echo "💰 DCA 金额: 5 USDC"
echo "📊 价格阈值: 85000, 82000, 79000 USD"
echo "🤖 AI 置信度阈值: 70%"
echo ""

read -p "确认部署配置正确? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 1
fi

echo ""
echo "🔧 开始部署..."

# 进入 CRE 工作流目录
cd "$(dirname "$0")/../aibrk-cre"

echo "📦 安装依赖..."
cd my-workflow
bun install

echo "🚀 部署到 Chainlink DON..."
cre workflow deploy . --target production-settings

echo ""
echo "✅ 部署完成！"
echo "=============="
echo ""
echo "📊 监控信息："
echo "- 工作流名称: ai-berkshire-hathaway-production"
echo "- 执行频率: 每 10 分钟"
echo "- 网络: Base 主网"
echo "- DCA 策略: BTC < 85k/82k/79k 时投资 5 USDC"
echo ""
echo "🔍 监控命令："
echo "cre workflow logs ai-berkshire-hathaway-production"
echo ""
echo "⚠️  重要提醒："
echo "1. 确保钱包有足够的 ETH 支付 gas 费用"
echo "2. 确保有足够的 USDC 用于 DCA 投资"
echo "3. 定期监控工作流执行状态"
echo "4. 关注市场变化，必要时调整参数"
echo ""
echo "🎉 AI Berkshire Hathaway 生产环境部署成功！"
