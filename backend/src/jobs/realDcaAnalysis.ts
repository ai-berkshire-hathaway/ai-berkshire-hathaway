import axios from 'axios';
import { Contract } from 'ethers';
import { fetchChainlinkBtcPrice } from '../services/chainlink';
import { BaseDcaAbi, BASE_MAINNET, baseTraderWallet } from '../config/chains';

interface PriceData {
  chainlinkPrice: number;
  coinGeckoPrice: number;
  binancePrice: number;
  consensus: boolean;
  avgPrice: number;
  maxDeviation: number;
  timestamp: string;
}

interface AIAnalysis {
  shouldInvest: boolean;
  confidence: number;
  reasoning: string;
  marketConditions: {
    volatility: number;
    sentiment: string;
    technicalIndicators: string;
  };
  timestamp: string;
}

interface DCADecision {
  executeInvestment: boolean;
  amount: number;
  reason: string;
  priceTarget: number;
  confidenceScore: number;
  timestamp: string;
}

interface RealDCAResult {
  success: boolean;
  priceData: PriceData;
  aiAnalysis: AIAnalysis;
  dcaDecision: DCADecision;
  executionResult?: {
    executed: boolean;
    txHash?: string;
    error?: string;
  };
  timestamp: string;
}

/**
 * 获取真实的多源 BTC 价格数据
 */
async function fetchRealPriceData(): Promise<PriceData> {
  console.log('📊 获取多源 BTC 价格数据...');
  
  try {
    // 1. Chainlink 价格 (Base 主网)
    const chainlinkData = await fetchChainlinkBtcPrice('mainnet');
    const chainlinkPrice = Number(chainlinkData.price) / (10 ** chainlinkData.decimals);
    
    // 2. CoinGecko 价格
    const coinGeckoResponse = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { timeout: 10000 }
    );
    const coinGeckoPrice = coinGeckoResponse.data.bitcoin.usd;
    
    // 3. Binance 价格
    const binanceResponse = await axios.get(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      { timeout: 10000 }
    );
    const binancePrice = parseFloat(binanceResponse.data.lastPrice);
    
    // 计算价格共识
    const prices = [chainlinkPrice, coinGeckoPrice, binancePrice];
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const maxDeviation = Math.max(...prices.map(price => Math.abs(price - avgPrice) / avgPrice));
    const consensus = maxDeviation < 0.01; // 1% 以内认为达成共识
    
    console.log(`💰 Chainlink: $${chainlinkPrice.toFixed(2)}`);
    console.log(`💰 CoinGecko: $${coinGeckoPrice.toFixed(2)}`);
    console.log(`💰 Binance: $${binancePrice.toFixed(2)}`);
    console.log(`📊 平均价格: $${avgPrice.toFixed(2)}`);
    console.log(`📊 最大偏差: ${(maxDeviation * 100).toFixed(2)}%`);
    console.log(`✅ 价格共识: ${consensus ? '达成' : '未达成'}`);
    
    return {
      chainlinkPrice,
      coinGeckoPrice,
      binancePrice,
      consensus,
      avgPrice,
      maxDeviation,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ 价格数据获取失败:', error);
    throw new Error(`Failed to fetch price data: ${error}`);
  }
}

/**
 * 使用 OpenAI 进行真实的 AI 市场分析
 */
async function performAIAnalysis(priceData: PriceData): Promise<AIAnalysis> {
  console.log('🤖 执行 AI 市场分析...');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  try {
    const prompt = `
作为一个专业的加密货币投资分析师，请分析当前的 BTC 市场情况并给出 DCA 投资建议。

当前市场数据：
- Chainlink 价格: $${priceData.chainlinkPrice.toFixed(2)}
- CoinGecko 价格: $${priceData.coinGeckoPrice.toFixed(2)}
- Binance 价格: $${priceData.binancePrice.toFixed(2)}
- 平均价格: $${priceData.avgPrice.toFixed(2)}
- 价格偏差: ${(priceData.maxDeviation * 100).toFixed(2)}%
- 价格共识: ${priceData.consensus ? '达成' : '未达成'}

DCA 策略参数：
- 投资金额: 5 USDC
- 价格阈值: 当 BTC < $85,000 或 < $82,000 或 < $79,000 时考虑投资
- 最低置信度要求: 70%

请提供：
1. 是否建议现在执行 DCA 投资 (true/false)
2. 你的置信度 (0-1 之间的数值)
3. 详细的投资理由
4. 市场波动性评估 (0-1 之间)
5. 市场情绪 (bullish/bearish/neutral)
6. 技术指标分析

请以 JSON 格式回复，格式如下：
{
  "shouldInvest": boolean,
  "confidence": number,
  "reasoning": "详细分析...",
  "volatility": number,
  "sentiment": "bullish/bearish/neutral",
  "technicalIndicators": "技术分析..."
}
`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional cryptocurrency investment analyst. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const aiResponse = JSON.parse(response.data.choices[0].message.content);
    
    console.log(`🧠 AI 建议: ${aiResponse.shouldInvest ? '投资' : '观望'}`);
    console.log(`🎯 置信度: ${(aiResponse.confidence * 100).toFixed(1)}%`);
    console.log(`💭 理由: ${aiResponse.reasoning}`);
    
    return {
      shouldInvest: aiResponse.shouldInvest,
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning,
      marketConditions: {
        volatility: aiResponse.volatility,
        sentiment: aiResponse.sentiment,
        technicalIndicators: aiResponse.technicalIndicators
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ AI 分析失败:', error);
    throw new Error(`AI analysis failed: ${error}`);
  }
}

/**
 * 根据价格和 AI 分析做出 DCA 决策
 */
function makeDCADecision(priceData: PriceData, aiAnalysis: AIAnalysis): DCADecision {
  console.log('⚖️ 制定 DCA 投资决策...');
  
  const priceThresholds = [85000, 82000, 79000];
  const minConfidence = 0.7;
  const investmentAmount = 5; // USDC
  
  let executeInvestment = false;
  let reason = '';
  let priceTarget = 0;
  
  // 检查价格阈值
  const belowThreshold = priceThresholds.find(threshold => priceData.avgPrice < threshold);
  
  if (!priceData.consensus) {
    reason = '价格共识未达成，暂不投资';
  } else if (!belowThreshold) {
    reason = `BTC 价格 $${priceData.avgPrice.toFixed(2)} 高于所有阈值 [${priceThresholds.join(', ')}]，暂不投资`;
  } else if (aiAnalysis.confidence < minConfidence) {
    reason = `AI 置信度 ${(aiAnalysis.confidence * 100).toFixed(1)}% 低于最低要求 ${minConfidence * 100}%，暂不投资`;
  } else if (!aiAnalysis.shouldInvest) {
    reason = 'AI 分析建议暂不投资';
  } else {
    executeInvestment = true;
    priceTarget = belowThreshold;
    reason = `所有条件满足：价格 $${priceData.avgPrice.toFixed(2)} < $${belowThreshold}，AI 置信度 ${(aiAnalysis.confidence * 100).toFixed(1)}%，执行 DCA 投资`;
  }
  
  console.log(`📋 投资决策: ${executeInvestment ? '✅ 执行投资' : '❌ 暂不投资'}`);
  console.log(`📝 决策理由: ${reason}`);
  
  return {
    executeInvestment,
    amount: investmentAmount,
    reason,
    priceTarget: priceTarget || priceData.avgPrice,
    confidenceScore: aiAnalysis.confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * 执行真实的 DCA 分析（包含可选的链上执行）
 */
export async function executeRealDCAAnalysis(): Promise<RealDCAResult> {
  const startTime = new Date();
  console.log(`🚀 开始真实 DCA 分析 - ${startTime.toISOString()}`);
  console.log('='.repeat(60));
  
  try {
    // 1. 获取真实价格数据
    const priceData = await fetchRealPriceData();
    
    // 2. 执行 AI 分析
    const aiAnalysis = await performAIAnalysis(priceData);
    
    // 3. 制定 DCA 决策
    const dcaDecision = makeDCADecision(priceData, aiAnalysis);
    
    // 4. 可选：执行链上交易
    let executionResult;
    if (dcaDecision.executeInvestment && process.env.BASE_DCA_CONTROLLER_ADDRESS) {
      console.log('💼 准备执行链上 DCA 交易...');
      try {
        const contract = new Contract(
          process.env.BASE_DCA_CONTROLLER_ADDRESS,
          BaseDcaAbi,
          baseTraderWallet
        );
        
        const tx = await contract.updatePriceAndMaybeInvest();
        console.log(`🔗 交易已发送: ${tx.hash}`);
        
        await tx.wait();
        console.log('✅ 交易已确认');
        
        executionResult = {
          executed: true,
          txHash: tx.hash
        };
      } catch (error) {
        console.error('❌ 链上交易失败:', error);
        executionResult = {
          executed: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    } else if (dcaDecision.executeInvestment) {
      console.log('💡 模拟模式：DCA 决策为投资，但未配置合约地址');
      executionResult = {
        executed: false,
        error: 'Contract address not configured - simulation mode'
      };
    }
    
    const result: RealDCAResult = {
      success: true,
      priceData,
      aiAnalysis,
      dcaDecision,
      executionResult,
      timestamp: new Date().toISOString()
    };
    
    // 输出完整报告
    console.log('\n📊 DCA 分析完整报告');
    console.log('='.repeat(60));
    console.log(`⏰ 执行时间: ${startTime.toISOString()}`);
    console.log(`💰 BTC 平均价格: $${priceData.avgPrice.toFixed(2)}`);
    console.log(`🤖 AI 建议: ${aiAnalysis.shouldInvest ? '投资' : '观望'} (置信度: ${(aiAnalysis.confidence * 100).toFixed(1)}%)`);
    console.log(`⚖️ 最终决策: ${dcaDecision.executeInvestment ? '执行投资' : '暂不投资'}`);
    if (executionResult) {
      console.log(`🔗 链上执行: ${executionResult.executed ? '成功' : '失败'}`);
      if (executionResult.txHash) {
        console.log(`📋 交易哈希: ${executionResult.txHash}`);
      }
    }
    console.log('='.repeat(60));
    
    return result;
    
  } catch (error) {
    console.error('❌ DCA 分析执行失败:', error);
    
    return {
      success: false,
      priceData: {} as PriceData,
      aiAnalysis: {} as AIAnalysis,
      dcaDecision: {} as DCADecision,
      timestamp: new Date().toISOString()
    };
  }
}

// 如果直接运行此文件
if (require.main === module) {
  executeRealDCAAnalysis()
    .then((result) => {
      console.log('\n🎉 分析完成！');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 致命错误:', error);
      process.exit(1);
    });
}
