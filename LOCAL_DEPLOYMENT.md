# AI Berkshire Hathaway - 本地部署指南

## 概述

由于 Chainlink CRE 工作流部署目前处于早期访问阶段，你可以选择在本地运行 AI DCA 策略，而无需等待 Chainlink DON 部署权限。

## 本地运行方式

### 方式一：使用 Shell 脚本

```bash
# 设置环境变量
export OPENAI_API_KEY="your_openai_api_key"
export BASE_DCA_CONTROLLER_ADDRESS="your_deployed_contract_address"  # 可选

# 运行本地 DCA 脚本
./scripts/run-local-production.sh
```

### 方式二：集成到后端服务

```typescript
import { startLocalDcaCron, executeLocalDCACron } from './src/jobs/dcaCron';

// 启动持续的 cron 任务（每10分钟执行一次）
startLocalDcaCron();

// 或者手动执行一次
const result = await executeLocalDCACron();
console.log('DCA Result:', result);
```

### 方式三：直接使用 CRE CLI

```bash
cd aibrk-cre/my-workflow

# 模拟运行工作流
cre workflow simulate . --target ai-dca-settings --verbose

# 或者使用生产配置（如果存在）
cre workflow simulate . --target production-settings --verbose
```

## 环境配置

### 必需的环境变量

```bash
# OpenAI API 密钥（用于 AI 市场分析）
export OPENAI_API_KEY="sk-your-openai-api-key"

# 可选：DCA 控制器合约地址（如果未设置将使用模拟模式）
export BASE_DCA_CONTROLLER_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"
```

### 工作流配置文件

本地运行使用 `aibrk-cre/my-workflow/config.ai-dca.json` 配置：

```json
{
  "schedule": "*/10 * * * *",
  "dcaSettings": {
    "usdcAmount": 100000000,           // 5 USDC (100 * 10^6 wei)
    "priceThresholds": [85000, 82000, 79000],  // BTC 价格阈值
    "maxSlippage": 0.005,              // 最大滑点 0.5%
    "minConfidence": 0.7               // AI 最小置信度 70%
  }
}
```

## 功能特性

### ✅ 本地运行支持的功能

- **多源价格获取**: Chainlink、CoinGecko、Binance
- **AI 市场分析**: 使用 OpenAI GPT 进行市场情绪分析
- **价格共识机制**: 多个数据源的价格验证
- **DCA 策略执行**: 基于价格阈值和 AI 置信度的自动投资
- **详细日志记录**: 完整的执行报告和调试信息
- **错误处理**: 优雅的错误恢复和重试机制

### ⚠️ 本地运行限制

- **手动触发**: 需要通过 cron 或定时任务手动调度
- **无自动扩展**: 不具备 Chainlink DON 的分布式特性
- **单点故障**: 依赖本地环境的稳定性
- **资源消耗**: 需要本地计算资源

## 部署对比

| 特性 | 本地部署 | Chainlink DON 部署 |
|------|----------|-------------------|
| **可用性** | ✅ 立即可用 | ❌ 需要申请权限 |
| **可靠性** | ⚠️ 依赖本地环境 | ✅ 分布式高可用 |
| **扩展性** | ❌ 单机限制 | ✅ 自动扩展 |
| **成本** | ✅ 免费（除 API 调用） | ⚠️ 需要 LINK 代币 |
| **维护** | ❌ 需要手动维护 | ✅ 自动维护 |

## 监控和调试

### 查看执行日志

```bash
# 查看实时日志
tail -f /path/to/your/logs/dca.log

# 或者在代码中添加日志
console.log('[DCA] Execution result:', result);
```

### 测试配置

```bash
# 验证环境配置
node -e "
const { localDCARunner } = require('./backend/src/jobs/localDcaCron');
console.log('Environment validation:', localDCARunner.validateEnvironment());
"
```

### 调试模式

```bash
# 使用详细模式运行
cre workflow simulate . --target ai-dca-settings --verbose
```

## 生产环境建议

### 短期方案（本地运行）

1. **使用 PM2 管理进程**:
   ```bash
   npm install -g pm2
   pm2 start backend/src/jobs/localDcaCron.ts --name "ai-dca"
   pm2 monit
   ```

2. **设置系统 Cron**:
   ```bash
   # 每10分钟执行一次
   */10 * * * * /path/to/scripts/run-local-production.sh
   ```

3. **监控和告警**:
   - 设置日志监控
   - 配置失败告警
   - 定期健康检查

### 长期方案（Chainlink DON）

1. **申请 CRE 部署权限**: https://cre.chain.link/request-access
2. **准备生产配置**: 完善 `config.production.json`
3. **部署到 DON**: 使用 `cre workflow deploy`
4. **监控和维护**: 使用 Chainlink 官方工具

## 故障排除

### 常见问题

1. **OpenAI API 调用失败**
   - 检查 API 密钥是否正确
   - 确认账户余额充足
   - 验证网络连接

2. **CRE 工作流执行失败**
   - 检查工作流文件是否存在
   - 验证配置文件格式
   - 查看详细错误日志

3. **价格数据获取失败**
   - 检查网络连接
   - 验证 API 端点可用性
   - 考虑添加重试机制

### 获取帮助

- **CRE 文档**: https://docs.chain.link/cre
- **项目 Issues**: GitHub Issues
- **社区支持**: Chainlink Discord

---

## 总结

本地部署是一个很好的过渡方案，让你可以立即开始使用 AI Berkshire Hathaway DCA 策略，而无需等待 Chainlink DON 部署权限。随着项目的发展，建议最终迁移到 Chainlink DON 以获得更好的可靠性和扩展性。
