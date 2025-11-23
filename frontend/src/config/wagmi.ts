import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// 项目 ID (你需要在 WalletConnect 注册获取)
const projectId = 'your-project-id';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
