# AI Berkshire Hathaway DCA Dashboard

一个用于监控和管理 Base 主网上 DCA (Dollar Cost Averaging) 合约的现代化 Web 应用。

## 🎯 功能特性

- **实时价格监控**: 显示 BTC 当前价格和历史数据
- **DCA 策略跟踪**: 监控自动定投策略的执行状态
- **合约余额**: 实时显示合约中的 USDC 余额
- **执行历史**: 查看所有 DCA 执行记录
- **阈值管理**: 可视化显示价格阈值和触发状态
- **响应式设计**: 支持桌面和移动设备

## 🏗️ 技术栈

- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **Wagmi** - React Hooks for Ethereum
- **Ethers.js** - 以太坊交互库
- **Lucide React** - 现代图标库

## 📦 安装和运行

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 本地开发

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 3. 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist/` 目录中。

## 🌐 IPFS 部署

### 自动部署脚本

```bash
chmod +x deploy-ipfs.sh
./deploy-ipfs.sh
```

### 手动部署

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **上传到 IPFS**:
   ```bash
   # 使用 IPFS CLI
   ipfs add -r dist
   
   # 或使用在线服务
   # - Pinata: https://pinata.cloud/
   # - Infura IPFS: https://infura.io/product/ipfs
   # - Fleek: https://fleek.co/
   ```

3. **设置 ENS**:
   - 访问 [ENS Manager](https://app.ens.domains/)
   - 选择你的域名
   - 在 Records 中设置 Content Hash 为 `ipfs://YOUR_IPFS_HASH`

## 🔧 配置

### 合约地址

应用监控以下合约：

- **DCA Controller**: `0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6`
- **USDC Token**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **网络**: Base Mainnet (Chain ID: 8453)

### 环境变量

创建 `.env.local` 文件（可选）:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_DCA_CONTRACT_ADDRESS=0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6
VITE_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## 📊 DCA 策略

当前配置的 DCA 策略：

| 阈值 | 投资金额 | 状态 |
|------|----------|------|
| $86,000 | 5 USDC | 已执行 |
| $82,000 | 5 USDC | 等待中 |
| $79,000 | 5 USDC | 等待中 |

## 🔗 相关链接

- **合约浏览器**: [BaseScan](https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6)
- **Base 主网**: [Base.org](https://base.org/)
- **Chainlink 文档**: [docs.chain.link](https://docs.chain.link/)

## 🚀 部署到 ENS

### 步骤 1: 构建和上传

```bash
# 构建项目
npm run build

# 上传到 IPFS (使用 Pinata 为例)
# 1. 注册 Pinata 账号
# 2. 上传 dist 文件夹
# 3. 获取 IPFS Hash
```

### 步骤 2: 设置 ENS

1. 访问 [ENS Manager](https://app.ens.domains/)
2. 连接钱包并选择你的域名
3. 点击 "Records" 标签
4. 设置 "Content Hash":
   - 选择 "IPFS"
   - 输入你的 IPFS Hash
5. 保存更改并等待确认

### 步骤 3: 验证

- 等待 5-10 分钟让 DNS 传播
- 访问 `https://your-domain.eth.limo`
- 或使用支持 ENS 的浏览器直接访问 `your-domain.eth`

## 🛠️ 开发

### 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   └── DCADashboard.tsx    # 主仪表板组件
│   ├── config/
│   │   ├── contracts.ts        # 合约配置和 ABI
│   │   └── wagmi.ts           # Web3 配置
│   ├── App.tsx                # 主应用组件
│   ├── main.tsx               # 应用入口
│   └── index.css              # 全局样式
├── deploy-ipfs.sh             # IPFS 部署脚本
├── tailwind.config.js         # TailwindCSS 配置
└── package.json               # 项目依赖
```

### 添加新功能

1. **新组件**: 在 `src/components/` 中创建
2. **合约交互**: 使用 `wagmi` hooks
3. **样式**: 使用 TailwindCSS 类名
4. **图标**: 使用 `lucide-react`

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 这是一个演示项目，用于展示 Chainlink 服务的集成。在生产环境中使用前请进行充分测试。
