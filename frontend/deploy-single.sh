#!/bin/bash

# AI Berkshire Hathaway DCA Dashboard - 单文件 IPFS 部署脚本

echo "🚀 开始构建单文件版本..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 frontend 目录中运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建单文件版本
echo "🔨 构建单文件版本..."
pnpm run build:single

# 检查构建是否成功
if [ ! -d "dist-single" ]; then
    echo "❌ 构建失败，dist-single 目录不存在"
    exit 1
fi

if [ ! -f "dist-single/index.html" ]; then
    echo "❌ 构建失败，index.html 不存在"
    exit 1
fi

echo "✅ 单文件构建完成！"

# 显示文件信息
FILE_SIZE=$(du -h dist-single/index.html | cut -f1)
echo "📄 生成的文件: dist-single/index.html"
echo "📊 文件大小: $FILE_SIZE"

echo ""
echo "🎉 单文件部署准备完成！"
echo ""
echo "📋 部署选项："
echo ""
echo "🌐 方法 1: 直接上传到 Pinata"
echo "   1. 访问 https://app.pinata.cloud/pinmanager"
echo "   2. 点击 'Upload' -> 'File'"
echo "   3. 选择 dist-single/index.html"
echo "   4. 上传完成后获取 IPFS 哈希"
echo ""
echo "🌐 方法 2: 使用 IPFS CLI"
if command -v ipfs &> /dev/null; then
    echo "   检测到 IPFS CLI，正在上传..."
    IPFS_HASH=$(ipfs add dist-single/index.html | cut -d ' ' -f 2)
    echo "   ✅ 上传成功！"
    echo "   📋 IPFS Hash: $IPFS_HASH"
    echo ""
    echo "🔗 访问链接："
    echo "   • IPFS.io: https://ipfs.io/ipfs/$IPFS_HASH"
    echo "   • Cloudflare: https://cloudflare-ipfs.com/ipfs/$IPFS_HASH"
    echo "   • Dweb.link: https://dweb.link/ipfs/$IPFS_HASH"
    echo ""
    echo "📌 固定到本地节点..."
    ipfs pin add $IPFS_HASH
else
    echo "   IPFS CLI 未安装，请手动上传"
fi

echo ""
echo "🏷️  ENS 设置："
echo "   1. 访问 https://app.ens.domains/"
echo "   2. 选择你的 ENS 域名"
echo "   3. 在 Records > Content 中设置:"
if [ ! -z "$IPFS_HASH" ]; then
    echo "      ipfs://$IPFS_HASH"
else
    echo "      ipfs://YOUR_IPFS_HASH"
fi
echo ""
echo "✨ 优势："
echo "   • 只有一个文件，上传简单"
echo "   • 所有资源都内联，加载快速"
echo "   • 完全去中心化，无外部依赖"
echo "   • 适合 IPFS 和 ENS 部署"
echo ""
echo "📊 合约信息："
echo "   DCA 合约地址: 0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
echo "   Base 主网: https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
