import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// IPFS 专用配置
export default defineConfig({
  plugins: [react()],
  base: "./", // 关键：使用相对路径
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // 减少文件大小
    rollupOptions: {
      output: {
        // 简化文件名，避免特殊字符
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks: {
          // 手动分割 chunks 以优化加载
          vendor: ['react', 'react-dom'],
          wagmi: ['wagmi', '@wagmi/core', 'viem'],
          ui: ['lucide-react']
        }
      }
    },
    // 优化构建
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true
      }
    }
  },
  // 确保所有资源使用相对路径
  experimental: {
    renderBuiltUrl(filename: string) {
      return './' + filename;
    }
  }
});
