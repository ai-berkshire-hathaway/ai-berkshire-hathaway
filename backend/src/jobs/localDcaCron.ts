import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface LocalDCAResult {
  success: boolean;
  timestamp: string;
  output?: string;
  error?: string;
}

/**
 * 本地 DCA 执行器
 * 在本地运行 CRE 工作流，无需部署到 Chainlink DON
 */
export class LocalDCARunner {
  private workflowPath: string;
  private isRunning: boolean = false;

  constructor() {
    // 工作流路径
    this.workflowPath = path.join(process.cwd(), '../aibrk-cre/my-workflow');
  }

  /**
   * 执行本地 DCA 工作流
   */
  async executeDCA(): Promise<LocalDCAResult> {
    if (this.isRunning) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'DCA workflow is already running'
      };
    }

    this.isRunning = true;
    
    try {
      console.log('🚀 Starting local DCA execution...');
      
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      // 设置 DCA 控制器地址（如果未设置则使用模拟地址）
      const dcaControllerAddress = process.env.BASE_DCA_CONTROLLER_ADDRESS || 
        '0x0000000000000000000000000000000000000000';
      
      // 执行 CRE 工作流模拟
      const command = `cd ${this.workflowPath} && cre workflow simulate . --target ai-dca-settings --verbose`;
      
      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          DCA_CONTROLLER_ADDRESS: dcaControllerAddress
        },
        timeout: 60000 // 60秒超时
      });

      console.log('✅ Local DCA execution completed');
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        output: stdout
      };

    } catch (error) {
      console.error('❌ Local DCA execution failed:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 检查工作流状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      workflowPath: this.workflowPath,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * 验证环境配置
   */
  validateEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查必需的环境变量
    if (!process.env.OPENAI_API_KEY) {
      issues.push('OPENAI_API_KEY is not set');
    }

    // 检查工作流文件是否存在
    try {
      const fs = require('fs');
      const configPath = path.join(this.workflowPath, 'config.ai-dca.json');
      const mainPath = path.join(this.workflowPath, 'enhanced-main.ts');
      
      if (!fs.existsSync(configPath)) {
        issues.push('config.ai-dca.json not found');
      }
      
      if (!fs.existsSync(mainPath)) {
        issues.push('enhanced-main.ts not found');
      }
    } catch (error) {
      issues.push('Cannot access workflow files');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// 创建全局实例
export const localDCARunner = new LocalDCARunner();

/**
 * Cron 任务函数 - 每10分钟执行一次
 */
export async function executeLocalDCACron() {
  console.log('🕐 Local DCA Cron triggered at:', new Date().toISOString());
  
  // 验证环境
  const validation = localDCARunner.validateEnvironment();
  if (!validation.valid) {
    console.error('❌ Environment validation failed:', validation.issues);
    return;
  }

  // 执行 DCA
  const result = await localDCARunner.executeDCA();
  
  if (result.success) {
    console.log('✅ Local DCA execution successful');
    if (result.output) {
      console.log('📊 Output:', result.output);
    }
  } else {
    console.error('❌ Local DCA execution failed:', result.error);
  }
  
  return result;
}

// 如果直接运行此文件，执行一次 DCA
if (require.main === module) {
  executeLocalDCACron()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
