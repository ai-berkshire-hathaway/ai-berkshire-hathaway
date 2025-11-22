module.exports = {
  apps: [
    {
      name: "aibkh-backend",
      script: "dist/index.js",
      cwd: "./backend",
      // 自动重启
      autorestart: true,
      watch: false, // 生产环境建议关闭 watch
      max_memory_restart: "512M",

      // 生产环境变量
      env: {
        NODE_ENV: "development",
        ARC_RPC_URL: process.env.ARC_RPC_URL,
        BASE_RPC_URL: process.env.BASE_RPC_URL,
        ARC_DCA_CONTROLLER_ADDRESS: process.env.ARC_DCA_CONTROLLER_ADDRESS,

        ARC_PRIVATE_KEY: process.env.ARC_PRIVATE_KEY,
        BASE_TRADER_PRIVATE_KEY: process.env.BASE_TRADER_PRIVATE_KEY,
        PRIVATE_KEY: process.env.PRIVATE_KEY,

        DATABASE_URL: process.env.DATABASE_URL,
        IRIS_BASE_URL: process.env.IRIS_BASE_URL || "https://iris-api-sandbox.circle.com",
        DESTINATION_ADDRESS: process.env.DESTINATION_ADDRESS,
      },

      // 生产环境变量（从 pm2 start --env production 生效）
      env_production: {
        NODE_ENV: "production",
        ARC_RPC_URL: process.env.ARC_RPC_URL,
        BASE_RPC_URL: process.env.BASE_RPC_URL,
        ARC_DCA_CONTROLLER_ADDRESS: process.env.ARC_DCA_CONTROLLER_ADDRESS,

        ARC_PRIVATE_KEY: process.env.ARC_PRIVATE_KEY,
        BASE_TRADER_PRIVATE_KEY: process.env.BASE_TRADER_PRIVATE_KEY,
        PRIVATE_KEY: process.env.PRIVATE_KEY,

        DATABASE_URL: process.env.DATABASE_URL,
        IRIS_BASE_URL: process.env.IRIS_BASE_URL || "https://iris-api-sandbox.circle.com",
        DESTINATION_ADDRESS: process.env.DESTINATION_ADDRESS,
      },
    },
  ],
};