#!/bin/bash

# AI Berkshire Hathaway - 真实本地 DCA 执行脚本
# 直接调用真实的价格 API 和 AI 分析，不使用 simulate

set -e

echo "🚀 AI Berkshire Hathaway - 真实本地 DCA 执行"
echo "=============================================="

# 检查必要的环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: OPENAI_API_KEY 环境变量未设置"
    echo "请设置 OpenAI API 密钥用于 AI 市场分析"
    exit 1
fi

# 检查合约地址是否已配置
if [ -z "$BASE_DCA_CONTROLLER_ADDRESS" ]; then
    echo "⚠️  警告: BASE_DCA_CONTROLLER_ADDRESS 未设置"
    echo "将使用只读模式运行（获取价格和 AI 分析，但不执行交易）"
    export DCA_CONTROLLER_ADDRESS="0x0000000000000000000000000000000000000000"
else
    export DCA_CONTROLLER_ADDRESS="$BASE_DCA_CONTROLLER_ADDRESS"
fi

echo ""
echo "📋 运行配置："
echo "=============="
echo "🌐 网络: Base 主网 (真实数据)"
echo "💰 DCA 金额: 5 USDC"
echo "📊 价格阈值: 85000, 82000, 79000 USD"
echo "🤖 AI 置信度阈值: 70%"
echo "🔗 DCA 控制器: $DCA_CONTROLLER_ADDRESS"
echo "📡 数据源: Chainlink + CoinGecko + Binance (真实 API)"
echo ""

read -p "确认开始真实 DCA 分析? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "运行已取消"
    exit 1
fi

echo ""
echo "🔧 准备本地环境..."

# 进入后端目录，使用 Node.js 直接执行
cd "$(dirname "$0")/../backend"

echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装 Node.js 依赖..."
    pnpm install
fi

echo ""
echo "🚀 执行真实 DCA 分析..."
echo "========================="
echo ""

# 直接运行 TypeScript 文件进行真实的价格获取和分析
node -r ts-node/register -e "
import { executeRealDCAAnalysis } from './src/jobs/realDcaAnalysis';

async function main() {
  try {
    console.log('🔍 开始真实 DCA 市场分析...');
    const result = await executeRealDCAAnalysis();
    console.log('📊 分析结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 分析失败:', error);
    process.exit(1);
  }
}

main();
"

echo ""
echo "✅ 真实 DCA 分析完成！"
echo "===================="
echo ""
echo "📊 运行信息："
echo "- 数据源: 真实 API 调用"
echo "- 价格获取: Chainlink + CoinGecko + Binance"
echo "- AI 分析: OpenAI GPT-4"
echo "- 交易执行: ${DCA_CONTROLLER_ADDRESS}"
echo ""
echo "🔍 如需持续监控，可以："
echo "1. 设置 cron 任务: */10 * * * * $0"
echo "2. 集成到后端服务的定时任务"
echo "3. 使用 PM2 进程管理器"
echo ""
echo "⚠️  注意事项："
echo "1. 真实 API 调用会消耗配额"
echo "2. 确保网络连接稳定"
echo "3. 监控 API 调用成本"
echo ""
echo "🎉 AI Berkshire Hathaway 真实分析完成！"
