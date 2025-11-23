# EnhancedDCAController 部署设置指南

## 📋 环境变量配置

### 1. 创建 .env 文件
```bash
cd contracts/dca
cp .env.example .env
```

### 2. 填写环境变量

打开 `.env` 文件并填入以下实际值：

#### 🔑 私钥配置
```bash
PRIVATE_KEY=0x...  # 你的私钥 (不要包含 0x 前缀)
```

#### 📍 Base 主网合约地址 (已预填)
这些地址已经在 `.env.example` 中预填好了：

- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **BTC/USD Price Feed**: `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F`
- **CCIP Router**: `0x881e3A65B4d4a04dD529061dd0071cf975F58bCD`
- **VRF Coordinator**: `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634`

#### 🎲 VRF 配置 (需要手动设置)

**重要**: 你需要先在 Chainlink VRF 控制台创建订阅：

1. 访问 [Chainlink VRF 控制台](https://vrf.chain.link/)
2. 连接你的钱包到 Base 主网
3. 创建新的 VRF 订阅
4. 获取 Subscription ID
5. 向订阅中添加 LINK 代币作为费用

```bash
VRF_SUBSCRIPTION_ID=123  # 替换为你的实际 subscription ID
```

VRF Key Hash 已预填 (500 gwei):
```bash
VRF_KEY_HASH=0xdc2f87677b01473c763cb0aee938ed3341512f6057324a584e5944e786144d70
```

## 🚀 部署步骤

### 1. 确保环境准备就绪
```bash
# 检查 Forge 版本
forge --version

# 编译合约
forge build
```

### 2. 部署合约
```bash
# 使用部署脚本
forge script script/DeployEnhancedDCAController.s.sol:DeployEnhancedDCAController \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 3. 或者使用 forge create (简单方式)
```bash
forge create --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  src/EnhancedDCAController.sol:EnhancedDCAController \
  --constructor-args \
    $USDC_ADDRESS \
    $BTC_USD_PRICE_FEED \
    $CCIP_ROUTER \
    $VRF_COORDINATOR \
    $VRF_SUBSCRIPTION_ID \
    $VRF_KEY_HASH \
    "[85000000000000,82000000000000,79000000000000]" \
    "[5000000,5000000,5000000]"
```

## 📊 构造函数参数说明

| 参数 | 值 | 说明 |
|------|----|----|
| `_usdc` | `0x833589...` | Base 主网 USDC 地址 |
| `_btcUsdPriceFeed` | `0x64c911...` | Chainlink BTC/USD 价格预言机 |
| `_ccipRouter` | `0x881e3A...` | Chainlink CCIP 路由器 |
| `_vrfCoordinator` | `0xd5D517...` | Chainlink VRF V2.5 协调器 |
| `_vrfSubscriptionId` | `123` | 你的 VRF 订阅 ID |
| `_vrfKeyHash` | `0xdc2f87...` | VRF Key Hash (500 gwei) |
| `_thresholds` | `[85000*10^8, 82000*10^8, 79000*10^8]` | 价格阈值 (8位小数) |
| `_amounts` | `[5*10^6, 5*10^6, 5*10^6]` | 定投金额 (USDC 6位小数) |

## ⚠️ 部署前检查清单

- [ ] 私钥已正确设置
- [ ] 钱包中有足够的 ETH 支付 gas 费用 (建议 0.1 ETH)
- [ ] 已创建 VRF 订阅并获得 Subscription ID
- [ ] VRF 订阅中有足够的 LINK 代币
- [ ] 已将部署地址添加为 VRF 订阅的消费者
- [ ] 合约编译成功 (`forge build`)

## 🔧 部署后配置

### 1. 添加合约为 VRF 消费者
在 [Chainlink VRF 控制台](https://vrf.chain.link/) 中：
1. 选择你的订阅
2. 点击 "Add consumer"
3. 输入部署的合约地址

### 2. 向合约存入 USDC
```bash
# 使用 cast 或直接在区块浏览器中调用
cast send $DEPLOYED_CONTRACT_ADDRESS \
  "deposit(uint256)" 50000000 \  # 50 USDC
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 3. 向合约存入 ETH (用于 CCIP 费用)
```bash
cast send $DEPLOYED_CONTRACT_ADDRESS \
  --value 0.01ether \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

## 🎯 验证部署

### 检查合约状态
```bash
# 检查当前 BTC 价格
cast call $DEPLOYED_CONTRACT_ADDRESS \
  "getCurrentPrice()" \
  --rpc-url $BASE_RPC_URL

# 检查 USDC 余额
cast call $DEPLOYED_CONTRACT_ADDRESS \
  "usdc()" \
  --rpc-url $BASE_RPC_URL | xargs cast call \
  "balanceOf(address)" $DEPLOYED_CONTRACT_ADDRESS \
  --rpc-url $BASE_RPC_URL
```

## 🚨 故障排除

### 常见错误

1. **"Invalid subscription ID"**
   - 确保在 VRF 控制台创建了订阅
   - 检查 Subscription ID 是否正确

2. **"Insufficient LINK balance"**
   - 向 VRF 订阅添加更多 LINK 代币

3. **"Consumer not added"**
   - 在 VRF 控制台将合约地址添加为消费者

4. **Gas 估算失败**
   - 检查网络连接
   - 确保私钥对应的地址有足够 ETH

## 📚 相关链接

- [Chainlink VRF 控制台](https://vrf.chain.link/)
- [Base 区块浏览器](https://basescan.org/)
- [Chainlink CCIP 文档](https://docs.chain.link/ccip)
- [Base 主网信息](https://docs.base.org/)
