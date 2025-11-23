# Base 主网部署指南

## 🎯 部署目标
在 Base 主网实现 AI 驱动的比特币 DCA 策略：
- **BTC < $85,000**: 定投 5 USDC
- **BTC < $82,000**: 定投 5 USDC  
- **BTC < $79,000**: 定投 5 USDC
- **执行频率**: 每 10 分钟检查一次

## 📋 部署清单

### ✅ 已完成
- [x] CRE 工作流代码 (`enhanced-main.ts`)
- [x] Base 主网配置 (`config.production.json`)
- [x] RPC 端点配置 (`project.yaml`)
- [x] 部署脚本 (`deploy-production.sh`)

### 🔄 待完成

#### 1. 合约部署
需要在 Base 主网部署以下合约：

```solidity
// 1. DCA 控制器合约
contracts/dca/src/EnhancedDCAController.sol

// 2. 储备管理合约
contracts/ReserveManager.sol

// 3. 余额读取器
contracts/BalanceReader.sol

// 4. 消息发射器
contracts/MessageEmitter.sol
```

**部署命令**:
```bash
cd contracts/dca
forge create --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  src/EnhancedDCAController.sol:EnhancedDCAController \
  --constructor-args <USDC_ADDRESS> <BTC_PRICE_FEED>
```

#### 2. 环境变量配置
复制并填写环境变量：
```bash
cp aibrk-cre/.env.production.template aibrk-cre/.env.production
# 编辑 .env.production 填入实际值
```

**必需的环境变量**:
- `CRE_ETH_PRIVATE_KEY`: 用于 CRE 工作流的私钥
- `OPENAI_API_KEY`: OpenAI API 密钥
- `BASE_DCA_CONTROLLER_ADDRESS`: 部署的 DCA 控制器地址
- `BASE_USDC_ADDRESS`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

#### 3. 资金准备
确保部署地址有足够资金：
- **ETH**: 用于 gas 费用 (建议 0.1 ETH)
- **USDC**: 用于 DCA 投资 (根据策略需求)

#### 4. 测试部署
在部署到生产前，建议先在测试网验证：
```bash
# 测试网部署
cre workflow simulate ./aibrk-cre/my-workflow --target ai-dca-settings

# 生产网部署
./scripts/deploy-production.sh
```

## 🔧 Base 主网特定配置

### 网络信息
- **Chain ID**: 8453
- **RPC URL**: `https://mainnet.base.org`
- **区块浏览器**: `https://basescan.org`

### 关键合约地址
```json
{
  "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "BTC/USD Price Feed": "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F",
  "WETH": "0x4200000000000000000000000000000000000006"
}
```

### DCA 策略配置
```json
{
  "dcaSettings": {
    "usdcAmount": 5000000,  // 5 USDC (6 decimals)
    "priceThresholds": [85000, 82000, 79000],  // USD
    "maxSlippage": 0.005,   // 0.5%
    "minConfidence": 0.7    // 70% AI 置信度
  }
}
```

## 🚀 部署步骤

### 1. 准备环境
```bash
# 设置环境变量
export CRE_ETH_PRIVATE_KEY="your_private_key"
export OPENAI_API_KEY="your_openai_key"

# 安装依赖
cd aibrk-cre/my-workflow
bun install
```

### 2. 部署合约
```bash
# 部署 DCA 控制器到 Base 主网
cd contracts/dca
forge create --rpc-url https://mainnet.base.org \
  --private-key $CRE_ETH_PRIVATE_KEY \
  src/EnhancedDCAController.sol:EnhancedDCAController
```

### 3. 更新配置
将部署的合约地址更新到 `config.production.json`

### 4. 部署工作流
```bash
# 执行部署脚本
./scripts/deploy-production.sh
```

### 5. 监控
```bash
# 查看工作流日志
cre workflow logs ai-berkshire-hathaway-production

# 监控执行状态
cre workflow status ai-berkshire-hathaway-production
```

## 📊 监控和维护

### 关键指标
- **执行频率**: 每 10 分钟
- **Gas 使用**: ~500,000 gas per execution
- **成功率**: 目标 >95%
- **AI 置信度**: 平均 >70%

### 告警设置
- 连续执行失败 > 3 次
- Gas 费用异常高
- USDC 余额不足
- AI API 调用失败

### 维护任务
- 每日检查执行日志
- 每周评估策略效果
- 每月更新价格阈值 (如需要)
- 定期补充 USDC 余额

## 🎉 部署完成后

部署成功后，你们将拥有：
1. **自动化 DCA 策略**: 基于 AI 分析的智能投资
2. **多源价格验证**: Chainlink + CoinGecko + Binance
3. **储备证明**: 透明的资产管理
4. **生产级监控**: 完整的日志和告警系统

**这将是 ETHGlobal 竞赛中最具创新性的 Chainlink 集成项目之一！** 🏆
