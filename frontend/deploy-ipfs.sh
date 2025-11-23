#!/bin/bash

# AI Berkshire Hathaway DCA Dashboard - IPFS 部署脚本

echo "🚀 开始构建 AI Berkshire Hathaway DCA Dashboard..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 frontend 目录中运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成！"

# 部署到 IPFS
echo "🌐 准备部署到 IPFS..."

# 检查是否安装了 IPFS CLI
if ! command -v ipfs &> /dev/null; then
    echo "⚠️  IPFS CLI 未安装，请先安装 IPFS"
    echo "   安装方法: https://docs.ipfs.io/install/"
    echo ""
    echo "🔗 或者使用在线服务："
    echo "   - Pinata: https://pinata.cloud/"
    echo "   - Infura IPFS: https://infura.io/product/ipfs"
    echo "   - Fleek: https://fleek.co/"
    exit 1
fi

# 添加到 IPFS
echo "📤 上传到 IPFS..."
IPFS_HASH=$(ipfs add -r dist | tail -n 1 | cut -d ' ' -f 2)

if [ -z "$IPFS_HASH" ]; then
    echo "❌ IPFS 上传失败"
    exit 1
fi

echo "✅ 上传成功！"
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 部署信息："
echo "   IPFS Hash: $IPFS_HASH"
echo "   IPFS Gateway: https://ipfs.io/ipfs/$IPFS_HASH"
echo "   Cloudflare IPFS: https://cloudflare-ipfs.com/ipfs/$IPFS_HASH"
echo ""
echo "🔗 ENS 设置："
echo "   1. 访问 ENS Manager: https://app.ens.domains/"
echo "   2. 选择你的域名"
echo "   3. 在 Records 中设置："
echo "      - Content Hash: ipfs://$IPFS_HASH"
echo "      - 或者 IPFS Hash: $IPFS_HASH"
echo ""
echo "⏰ 注意：ENS 更新可能需要几分钟时间生效"

# 固定到本地 IPFS 节点
echo "📌 固定到本地节点..."
ipfs pin add $IPFS_HASH

echo ""
echo "🎯 下一步："
echo "   1. 将 IPFS hash 设置到你的 ENS 域名"
echo "   2. 等待 DNS 传播（通常 5-10 分钟）"
echo "   3. 通过 ENS 域名访问你的 DCA Dashboard"
echo ""
echo "📊 DCA 合约地址: 0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
echo "🌐 Base 主网浏览器: https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
