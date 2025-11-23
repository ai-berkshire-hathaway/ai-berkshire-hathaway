#!/bin/bash

# AI Berkshire Hathaway - 本地生产环境运行脚本
# 在本地模拟生产环境执行 DCA 策略

set -e

echo "🚀 AI Berkshire Hathaway - 本地生产环境运行"
echo "============================================="

# 检查必要的环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: OPENAI_API_KEY 环境变量未设置"
    echo "请设置 OpenAI API 密钥用于 AI 市场分析"
    exit 1
fi

# 检查合约地址是否已配置
if [ -z "$BASE_DCA_CONTROLLER_ADDRESS" ]; then
    echo "⚠️  警告: BASE_DCA_CONTROLLER_ADDRESS 未设置"
    echo "将使用模拟模式运行（不会执行真实交易）"
    export DCA_CONTROLLER_ADDRESS="0x0000000000000000000000000000000000000000"
else
    export DCA_CONTROLLER_ADDRESS="$BASE_DCA_CONTROLLER_ADDRESS"
fi

echo ""
echo "📋 运行配置："
echo "=============="
echo "🌐 网络: Base 主网 (本地模拟)"
echo "⏰ 执行频率: 每 10 分钟"
echo "💰 DCA 金额: 5 USDC"
echo "📊 价格阈值: 85000, 82000, 79000 USD"
echo "🤖 AI 置信度阈值: 70%"
echo "🔗 DCA 控制器: $DCA_CONTROLLER_ADDRESS"
echo ""

read -p "确认开始本地运行? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "运行已取消"
    exit 1
fi

echo ""
echo "🔧 准备本地环境..."

# 进入 CRE 工作流目录
cd "$(dirname "$0")/../aibrk-cre/my-workflow"

echo "📦 安装依赖..."
bun install

echo ""
echo "🚀 启动本地 AI DCA 工作流..."
echo "================================"
echo ""
echo "💡 提示: 按 Ctrl+C 停止运行"
echo ""

# 选择运行模式
echo "请选择运行模式："
echo "1) CRE 工作流模拟 (不调用真实 API)"
echo "2) 真实 API 调用 (Chainlink + CoinGecko + Binance + OpenAI)"
echo ""
read -p "请选择 (1/2): " -n 1 -r
echo

if [[ $REPLY == "1" ]]; then
    echo "🧪 使用 CRE 本地模拟模式运行工作流..."
    cre workflow simulate . --target ai-dca-settings --verbose
elif [[ $REPLY == "2" ]]; then
    echo "🌐 使用真实 API 调用模式..."
    cd ../backend
    node -r ts-node/register src/jobs/realDcaAnalysis.ts
else
    echo "❌ 无效选择，退出"
    exit 1
fi

echo ""
echo "✅ 本地运行完成！"
echo "=================="
echo ""
echo "📊 运行信息："
echo "- 工作流名称: ai-berkshire-hathaway-dca"
echo "- 运行模式: 本地模拟"
echo "- 配置文件: config.ai-dca.json"
echo ""
echo "🔍 如需持续监控，可以："
echo "1. 设置 cron 任务定期运行此脚本"
echo "2. 使用 watch 命令: watch -n 600 ./run-local-production.sh"
echo "3. 集成到你的后端服务中"
echo ""
echo "⚠️  注意事项："
echo "1. 本地运行不会自动执行，需要手动触发"
echo "2. 如需自动化，建议集成到后端 cron 任务"
echo "3. 生产环境建议使用 Chainlink DON 部署"
echo ""
echo "🎉 AI Berkshire Hathaway 本地运行成功！"
