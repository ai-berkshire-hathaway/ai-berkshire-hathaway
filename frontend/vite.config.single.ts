import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";

// 单文件构建配置 - 将所有 CSS/JS 内联到 index.html
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true, // 移除 Vite 模块加载器
      inlinePattern: [], // 内联所有资源
      useRecommendedBuildConfig: true, // 使用推荐的构建配置
    })
  ],
  base: "./", // 使用相对路径
  build: {
    outDir: "dist-single",
    assetsDir: "", // 不使用 assets 目录
    cssCodeSplit: false, // 不分割 CSS
    sourcemap: false, // 不生成 sourcemap
    minify: "terser", // 使用 terser 压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true, // 移除 debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除特定函数调用
      },
      mangle: {
        safari10: true, // Safari 10 兼容性
      },
    },
    rollupOptions: {
      output: {
        // 单文件构建，不需要分割
        manualChunks: undefined,
        inlineDynamicImports: true, // 内联动态导入
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
      // 排除不需要的依赖（如果有的话）
      external: [],
    },
    // 优化设置
    chunkSizeWarningLimit: 3000, // 增加 chunk 大小警告限制
    reportCompressedSize: false, // 不报告压缩大小以加快构建
  },
  // 确保所有资源都被内联
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
});
