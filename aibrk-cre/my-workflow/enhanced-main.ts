import {
	bytesToHex,
	ConsensusAggregationByFields,
	type CronPayload,
	cre,
	type EVMLog,
	encodeCallMsg,
	getNetwork,
	type HTTPSendRequester,
	hexToBase64,
	LAST_FINALIZED_BLOCK_NUMBER,
	median,
	Runner,
	type Runtime,
	TxStatus,
} from '@chainlink/cre-sdk'
import { type Address, decodeFunctionResult, encodeFunctionData, zeroAddress } from 'viem'
import { z } from 'zod'

// Enhanced config schema for AI DCA + PoR
const configSchema = z.object({
	schedule: z.string(),
	// Original PoR config
	porUrl: z.string(),
	// New AI DCA config
	btcPriceUrl: z.string(),
	aiAnalysisUrl: z.string(),
	coinGeckoUrl: z.string(),
	binanceUrl: z.string(),
	openaiApiKey: z.string(),
	evms: z.array(
		z.object({
			// Original PoR addresses
			tokenAddress: z.string(),
			porAddress: z.string(),
			proxyAddress: z.string(),
			balanceReaderAddress: z.string(),
			messageEmitterAddress: z.string(),
			// New DCA addresses
			dcaControllerAddress: z.string(),
			btcUsdPriceFeedAddress: z.string(),
			chainSelectorName: z.string(),
			gasLimit: z.string(),
		}),
	),
})

type Config = z.infer<typeof configSchema>

// Original PoR interfaces
interface PORResponse {
	accountName: string
	totalTrust: number
	totalToken: number
	ripcord: boolean
	updatedAt: string
}

interface ReserveInfo {
	lastUpdated: Date
	totalReserve: number
}

// New AI DCA interfaces
interface PriceData {
	chainlinkPrice: number
	coinGeckoPrice: number
	binancePrice: number
	consensus: boolean
	avgPrice: number
	maxDeviation: number
}

interface AIAnalysis {
	shouldInvest: boolean
	confidence: number
	reasoning: string
	marketConditions: {
		volatility: number
		sentiment: string
		technicalIndicators: string
	}
}

interface DCAExecution {
	executed: boolean
	txHash?: string
	amount?: number
	price?: number
	timestamp: Date
}

// Utility function to safely stringify objects with bigints
const safeJsonStringify = (obj: any): string =>
	JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value), 2)

// Original PoR function (preserved)
const fetchReserveInfo = (sendRequester: HTTPSendRequester, config: Config): ReserveInfo => {
	const response = sendRequester.sendRequest({ method: 'GET', url: config.porUrl }).result()
	
	if (!response.success) {
		throw new Error(`Failed to fetch reserve info: ${response.error}`)
	}

	const porData: PORResponse = JSON.parse(response.data)
	
	return {
		lastUpdated: new Date(porData.updatedAt),
		totalReserve: porData.totalToken
	}
}

// New: Fetch multi-source BTC price data
const fetchPriceData = (sendRequester: HTTPSendRequester, config: Config): PriceData => {
	console.log('🔗 Fetching multi-source BTC price data...')
	
	// Fetch from multiple sources
	const coinGeckoResponse = sendRequester.sendRequest({
		method: 'GET',
		url: config.coinGeckoUrl
	}).result()
	
	const binanceResponse = sendRequester.sendRequest({
		method: 'GET',
		url: config.binanceUrl
	}).result()
	
	if (!coinGeckoResponse.success || !binanceResponse.success) {
		throw new Error('Failed to fetch external price data')
	}
	
	const coinGeckoData = JSON.parse(coinGeckoResponse.data)
	const binanceData = JSON.parse(binanceResponse.data)
	
	const coinGeckoPrice = coinGeckoData.bitcoin.usd
	const binancePrice = parseFloat(binanceData.price)
	
	// We'll get Chainlink price from on-chain call
	const chainlinkPrice = 67234.56 // Placeholder - will be fetched on-chain
	
	// Calculate consensus
	const prices = [chainlinkPrice, coinGeckoPrice, binancePrice]
	const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
	const deviations = prices.map(price => Math.abs(price - avgPrice) / avgPrice * 100)
	const maxDeviation = Math.max(...deviations)
	const consensus = maxDeviation <= 2.0 // Within 2%
	
	console.log(`💰 Price Data: Chainlink: $${chainlinkPrice}, CoinGecko: $${coinGeckoPrice}, Binance: $${binancePrice}`)
	console.log(`📊 Consensus: ${consensus ? 'REACHED' : 'FAILED'} (Max deviation: ${maxDeviation.toFixed(2)}%)`)
	
	return {
		chainlinkPrice,
		coinGeckoPrice,
		binancePrice,
		consensus,
		avgPrice,
		maxDeviation
	}
}

// New: AI market analysis using OpenAI
const performAIAnalysis = (sendRequester: HTTPSendRequester, config: Config, priceData: PriceData): AIAnalysis => {
	console.log('🤖 Performing AI market analysis...')
	
	const prompt = `Analyze the following BTC market data and determine if it's a good time for DCA investment:

Current Prices:
- Chainlink: $${priceData.chainlinkPrice}
- CoinGecko: $${priceData.coinGeckoPrice} 
- Binance: $${priceData.binancePrice}
- Average: $${priceData.avgPrice.toFixed(2)}
- Price Consensus: ${priceData.consensus ? 'REACHED' : 'FAILED'}
- Max Deviation: ${priceData.maxDeviation.toFixed(2)}%

Consider:
1. Price stability and consensus
2. Market volatility indicators
3. Technical analysis signals
4. Risk assessment for DCA strategy

Respond with JSON only:
{
  "shouldInvest": boolean,
  "confidence": number (0-1),
  "reasoning": "detailed explanation",
  "marketConditions": {
    "volatility": number,
    "sentiment": "bullish|bearish|neutral",
    "technicalIndicators": "description"
  }
}`

	const aiResponse = sendRequester.sendRequest({
		method: 'POST',
		url: config.aiAnalysisUrl,
		headers: {
			'Authorization': `Bearer ${config.openaiApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-4',
			messages: [
				{
					role: 'user',
					content: prompt
				}
			],
			temperature: 0.1,
			max_tokens: 500
		})
	}).result()
	
	if (!aiResponse.success) {
		console.log('⚠️ AI analysis failed, using fallback logic')
		// Fallback: simple price consensus check
		return {
			shouldInvest: priceData.consensus && priceData.avgPrice <= 90000,
			confidence: 0.6,
			reasoning: 'Fallback analysis: Price consensus reached and below $90k threshold',
			marketConditions: {
				volatility: priceData.maxDeviation,
				sentiment: 'neutral',
				technicalIndicators: 'Price consensus based decision'
			}
		}
	}
	
	const aiData = JSON.parse(aiResponse.data)
	const analysis = JSON.parse(aiData.choices[0].message.content)
	
	console.log(`🧠 AI Analysis: ${analysis.shouldInvest ? 'INVEST' : 'HOLD'} (Confidence: ${(analysis.confidence * 100).toFixed(1)}%)`)
	console.log(`💭 Reasoning: ${analysis.reasoning}`)
	
	return analysis
}

// New: Execute DCA based on AI analysis
const executeDCA = (
	runtime: Runtime,
	config: Config,
	priceData: PriceData,
	aiAnalysis: AIAnalysis
): DCAExecution => {
	console.log('⚡ Evaluating DCA execution...')
	
	// Check execution conditions
	if (!priceData.consensus) {
		console.log('❌ DCA blocked: Price consensus not reached')
		return { executed: false, timestamp: new Date() }
	}
	
	if (!aiAnalysis.shouldInvest) {
		console.log('❌ DCA blocked: AI recommends not to invest')
		return { executed: false, timestamp: new Date() }
	}
	
	if (aiAnalysis.confidence < 0.7) {
		console.log('❌ DCA blocked: AI confidence too low')
		return { executed: false, timestamp: new Date() }
	}
	
	console.log('✅ All conditions met, executing DCA...')
	
	// Execute DCA on each configured EVM
	for (const evmConfig of config.evms) {
		try {
			const network = getNetwork(evmConfig.chainSelectorName)
			
			// Call updatePriceAndMaybeInvest on DCA controller
			const callData = encodeFunctionData({
				abi: [{
					name: 'updatePriceAndMaybeInvest',
					type: 'function',
					inputs: [],
					outputs: []
				}],
				functionName: 'updatePriceAndMaybeInvest'
			})
			
			const txResult = runtime.sendTransaction({
				network,
				to: evmConfig.dcaControllerAddress as Address,
				data: callData,
				gasLimit: BigInt(evmConfig.gasLimit)
			})
			
			if (txResult.status === TxStatus.SUCCESS) {
				console.log(`✅ DCA executed on ${evmConfig.chainSelectorName}: ${txResult.hash}`)
				return {
					executed: true,
					txHash: txResult.hash,
					amount: 100, // 100 USDC
					price: priceData.avgPrice,
					timestamp: new Date()
				}
			} else {
				console.log(`❌ DCA failed on ${evmConfig.chainSelectorName}: ${txResult.error}`)
			}
		} catch (error) {
			console.log(`❌ DCA error on ${evmConfig.chainSelectorName}:`, error)
		}
	}
	
	return { executed: false, timestamp: new Date() }
}

// Enhanced main workflow function
export default function main(runtime: Runtime): void {
	const config = runtime.config as Config
	
	console.log('🚀 AI Berkshire Hathaway - Enhanced CRE Workflow Starting...')
	console.log('================================================================')
	
	const sendRequester = runtime.sendRequester
	
	try {
		// Step 1: Fetch original PoR data (preserved functionality)
		console.log('📊 Step 1: Fetching Proof of Reserves data...')
		const reserveInfo = fetchReserveInfo(sendRequester, config)
		console.log(`💰 Current Reserves: ${reserveInfo.totalReserve} tokens (Updated: ${reserveInfo.lastUpdated.toISOString()})`)
		
		// Step 2: Fetch multi-source price data
		console.log('\n📈 Step 2: Fetching multi-source BTC price data...')
		const priceData = fetchPriceData(sendRequester, config)
		
		// Step 3: Perform AI market analysis
		console.log('\n🤖 Step 3: Performing AI market analysis...')
		const aiAnalysis = performAIAnalysis(sendRequester, config, priceData)
		
		// Step 4: Execute DCA if conditions are met
		console.log('\n⚡ Step 4: Evaluating DCA execution...')
		const dcaResult = executeDCA(runtime, config, priceData, aiAnalysis)
		
		// Step 5: Generate comprehensive report
		console.log('\n📋 Step 5: Generating execution report...')
		const executionReport = {
			timestamp: new Date().toISOString(),
			workflowId: `ai-berkshire-${Date.now()}`,
			reserveData: {
				totalReserve: reserveInfo.totalReserve,
				lastUpdated: reserveInfo.lastUpdated.toISOString()
			},
			priceAnalysis: {
				chainlinkPrice: priceData.chainlinkPrice,
				coinGeckoPrice: priceData.coinGeckoPrice,
				binancePrice: priceData.binancePrice,
				averagePrice: priceData.avgPrice,
				consensus: priceData.consensus,
				maxDeviation: priceData.maxDeviation
			},
			aiAnalysis: {
				recommendation: aiAnalysis.shouldInvest ? 'INVEST' : 'HOLD',
				confidence: aiAnalysis.confidence,
				reasoning: aiAnalysis.reasoning,
				marketConditions: aiAnalysis.marketConditions
			},
			dcaExecution: {
				executed: dcaResult.executed,
				txHash: dcaResult.txHash,
				amount: dcaResult.amount,
				price: dcaResult.price,
				timestamp: dcaResult.timestamp.toISOString()
			},
			nextExecution: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Next 10 minutes
		}
		
		console.log('\n🎉 Workflow Execution Summary:')
		console.log('================================')
		console.log(`📊 Reserves: ${reserveInfo.totalReserve} tokens`)
		console.log(`💰 BTC Price: $${priceData.avgPrice.toFixed(2)} (Consensus: ${priceData.consensus ? '✅' : '❌'})`)
		console.log(`🤖 AI Recommendation: ${aiAnalysis.shouldInvest ? '✅ INVEST' : '❌ HOLD'} (${(aiAnalysis.confidence * 100).toFixed(1)}%)`)
		console.log(`⚡ DCA Executed: ${dcaResult.executed ? '✅ YES' : '❌ NO'}`)
		if (dcaResult.executed) {
			console.log(`🔗 Transaction: ${dcaResult.txHash}`)
		}
		console.log(`⏰ Next Execution: ${executionReport.nextExecution}`)
		
		// Store execution report for monitoring
		console.log('\n📝 Full Execution Report:')
		console.log(safeJsonStringify(executionReport))
		
	} catch (error) {
		console.error('❌ Workflow execution failed:', error)
		
		// Error handling and recovery
		const errorReport = {
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : String(error),
			workflowStatus: 'FAILED',
			nextRetry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
		}
		
		console.log('🚨 Error Report:', safeJsonStringify(errorReport))
	}
	
	console.log('\n🏁 AI Berkshire Hathaway Workflow Completed')
	console.log('===========================================')
}
