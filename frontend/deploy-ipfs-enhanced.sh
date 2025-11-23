#!/bin/bash

# AI Berkshire Hathaway DCA Dashboard - Enhanced IPFS 部署脚本
# 解决 Pinata 网关限制问题

echo "🚀 开始构建 AI Berkshire Hathaway DCA Dashboard..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 frontend 目录中运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建项目 (IPFS 优化版本)
echo "🔨 构建项目 (IPFS 优化)..."
pnpm run build:ipfs

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成！"

# 部署选项
echo ""
echo "🌐 选择部署方式："
echo "1) 使用本地 IPFS CLI"
echo "2) 使用 Pinata API (推荐)"
echo "3) 使用 Infura IPFS"
echo "4) 手动上传指导"

read -p "请选择 (1-4): " choice

case $choice in
    1)
        # 本地 IPFS CLI
        if ! command -v ipfs &> /dev/null; then
            echo "❌ IPFS CLI 未安装"
            echo "   安装方法: https://docs.ipfs.io/install/"
            exit 1
        fi
        
        echo "📤 使用本地 IPFS 上传..."
        IPFS_HASH=$(ipfs add -r dist | tail -n 1 | cut -d ' ' -f 2)
        
        if [ -z "$IPFS_HASH" ]; then
            echo "❌ IPFS 上传失败"
            exit 1
        fi
        
        echo "📌 固定到本地节点..."
        ipfs pin add $IPFS_HASH
        ;;
        
    2)
        # Pinata API
        echo ""
        echo "📌 使用 Pinata API 上传..."
        echo "请确保设置了环境变量："
        echo "   export PINATA_API_KEY='your_api_key'"
        echo "   export PINATA_SECRET_API_KEY='your_secret_key'"
        echo ""
        
        if [ -z "$PINATA_API_KEY" ] || [ -z "$PINATA_SECRET_API_KEY" ]; then
            echo "❌ 请设置 Pinata API 密钥"
            echo "获取密钥: https://app.pinata.cloud/keys"
            exit 1
        fi
        
        # 创建临时 tar 文件
        echo "📦 打包文件..."
        cd dist
        tar -czf ../dist.tar.gz .
        cd ..
        
        # 上传到 Pinata
        echo "📤 上传到 Pinata..."
        RESPONSE=$(curl -X POST \
            -H "pinata_api_key: $PINATA_API_KEY" \
            -H "pinata_secret_api_key: $PINATA_SECRET_API_KEY" \
            -F "file=@dist.tar.gz" \
            -F "pinataOptions={\"wrapWithDirectory\":false}" \
            -F "pinataMetadata={\"name\":\"AI-Berkshire-Hathaway-DCA-Dashboard\"}" \
            "https://api.pinata.cloud/pinning/pinFileToIPFS")
        
        IPFS_HASH=$(echo $RESPONSE | grep -o '"IpfsHash":"[^"]*' | cut -d'"' -f4)
        
        # 清理临时文件
        rm dist.tar.gz
        
        if [ -z "$IPFS_HASH" ]; then
            echo "❌ Pinata 上传失败"
            echo "响应: $RESPONSE"
            exit 1
        fi
        ;;
        
    3)
        # Infura IPFS
        echo ""
        echo "📌 使用 Infura IPFS..."
        echo "请设置环境变量："
        echo "   export INFURA_PROJECT_ID='your_project_id'"
        echo "   export INFURA_PROJECT_SECRET='your_project_secret'"
        
        if [ -z "$INFURA_PROJECT_ID" ] || [ -z "$INFURA_PROJECT_SECRET" ]; then
            echo "❌ 请设置 Infura 项目密钥"
            echo "获取密钥: https://infura.io/dashboard"
            exit 1
        fi
        
        # 这里可以添加 Infura IPFS 上传逻辑
        echo "⚠️  Infura IPFS 上传功能开发中..."
        exit 1
        ;;
        
    4)
        # 手动上传指导
        echo ""
        echo "📋 手动上传指导："
        echo ""
        echo "1️⃣ 压缩 dist 目录："
        echo "   cd dist && zip -r ../ai-berkshire-hathaway-dca.zip . && cd .."
        echo ""
        echo "2️⃣ 上传到 IPFS 服务："
        echo "   • Pinata: https://app.pinata.cloud/pinmanager"
        echo "   • Infura IPFS: https://infura.io/product/ipfs"
        echo "   • Fleek: https://fleek.co/"
        echo "   • Web3.Storage: https://web3.storage/"
        echo ""
        echo "3️⃣ 获取 IPFS 哈希后继续..."
        read -p "请输入 IPFS 哈希: " IPFS_HASH
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

if [ -z "$IPFS_HASH" ]; then
    echo "❌ 未获取到 IPFS 哈希"
    exit 1
fi

echo ""
echo "✅ 上传成功！"
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 部署信息："
echo "   IPFS Hash: $IPFS_HASH"
echo ""
echo "🔗 访问链接（选择可用的网关）："
echo "   • IPFS.io: https://ipfs.io/ipfs/$IPFS_HASH"
echo "   • Cloudflare: https://cloudflare-ipfs.com/ipfs/$IPFS_HASH"
echo "   • Dweb.link: https://dweb.link/ipfs/$IPFS_HASH"
echo "   • Gateway.ipfs.io: https://gateway.ipfs.io/ipfs/$IPFS_HASH"

if [ "$choice" = "2" ]; then
    echo "   • Pinata (需要自定义域名): https://gateway.pinata.cloud/ipfs/$IPFS_HASH"
fi

echo ""
echo "🏷️  ENS 设置步骤："
echo "   1. 访问 ENS Manager: https://app.ens.domains/"
echo "   2. 连接你的钱包"
echo "   3. 选择你的 ENS 域名"
echo "   4. 点击 'Records' 标签"
echo "   5. 在 'Content' 字段中输入: ipfs://$IPFS_HASH"
echo "   6. 保存更改并等待交易确认"
echo ""
echo "⏰ 注意："
echo "   • ENS 更新需要区块链交易确认（1-5分钟）"
echo "   • DNS 传播可能需要额外时间"
echo "   • 建议先通过 IPFS 网关测试访问"
echo ""
echo "🎯 测试步骤："
echo "   1. 先通过上面的 IPFS 网关链接测试"
echo "   2. 确认页面正常加载后再设置 ENS"
echo "   3. ENS 设置后通过 yourname.eth 或 yourname.eth.link 访问"
echo ""
echo "📊 合约信息："
echo "   DCA 合约地址: 0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
echo "   Base 主网浏览器: https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
echo ""
echo "🔧 故障排除："
echo "   • 如果页面空白，检查浏览器控制台错误"
echo "   • 如果 ENS 不工作，等待更长时间或清除浏览器缓存"
echo "   • 使用 https://etherscan.io/enslookup 检查 ENS 记录"
