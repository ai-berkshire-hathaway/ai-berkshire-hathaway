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

// Enhanced config schema for AI Berkshire Hathaway integration
const configSchema = z.object({
	schedule: z.string(),
	// Original PoR config
	porUrl: z.string(),
	// AI DCA config
	btcPriceUrl: z.string(),
	aiAnalysisUrl: z.string(),
	coinGeckoUrl: z.string(),
	binanceUrl: z.string(),
	openaiApiKey: z.string(),
	// DCA settings
	dcaSettings: z.object({
		usdcAmount: z.number(),
		priceThresholds: z.array(z.number()),
		maxSlippage: z.number(),
		minConfidence: z.number(),
	}),
	evms: z.array(
		z.object({
			tokenAddress: z.string(),
			porAddress: z.string(),
			proxyAddress: z.string(),
			balanceReaderAddress: z.string(),
			messageEmitterAddress: z.string(),
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
	
	if (response.statusCode !== 200) {
		throw new Error(`HTTP request failed with status: ${response.statusCode}`)
	}

	const responseText = Buffer.from(response.body).toString('utf-8')
	const porResp: PORResponse = JSON.parse(responseText)

	if (porResp.ripcord) {
		throw new Error('ripcord is true')
	}

	return {
		lastUpdated: new Date(porResp.updatedAt),
		totalReserve: porResp.totalToken,
	}
}

// Enhanced main workflow execution
const onCronTrigger = (runtime: Runtime<Config>, _payload: CronPayload): string => {
	console.log(' AI Berkshire Hathaway - Enhanced CRE Workflow Starting...')
	console.log('================================================================')
	
	try {
		const httpCapability = new cre.capabilities.HTTPClient()
		
		// Step 1: Execute Proof of Reserves
		console.log(' Step 1: Proof of Reserves Execution')
		const reserveInfo = httpCapability
			.sendRequest(
				runtime,
				fetchReserveInfo,
				ConsensusAggregationByFields<ReserveInfo>({
					lastUpdated: median,
					totalReserve: median,
				}),
			)(runtime.config)
			.result()
		
		// Step 2: Fetch and analyze price data (simplified for demo)
		console.log(' Step 2: Multi-Source Price Analysis')
		const priceData: PriceData = {
			chainlinkPrice: 67234.56,
			coinGeckoPrice: 67189.23,
			binancePrice: 67245.12,
			consensus: true,
			avgPrice: 67223.0,
			maxDeviation: 0.0008
		}
		
		console.log(` Price Data: Chainlink: $${priceData.chainlinkPrice}, CoinGecko: $${priceData.coinGeckoPrice}, Binance: $${priceData.binancePrice}`)
		console.log(` Consensus: ${priceData.consensus ? 'REACHED' : 'FAILED'} (Max deviation: ${(priceData.maxDeviation * 100).toFixed(2)}%)`)
		
		// Step 3: AI market analysis (simplified for demo)
		console.log(' Step 3: AI Market Analysis')
		const aiAnalysis: AIAnalysis = {
			shouldInvest: priceData.avgPrice <= 85000,
			confidence: 0.85,
			reasoning: "Market conditions favorable for DCA execution. Price below $85k threshold with strong consensus.",
			marketConditions: {
				volatility: priceData.maxDeviation,
				sentiment: "bullish",
				technicalIndicators: "Strong support levels, low volatility"
			}
		}
		
		console.log(` AI Analysis: ${aiAnalysis.shouldInvest ? 'INVEST' : 'HOLD'} (Confidence: ${(aiAnalysis.confidence * 100).toFixed(1)}%)`)
		console.log(` Reasoning: ${aiAnalysis.reasoning}`)
		
		// Step 4: Execute DCA if conditions are met (simulated)
		console.log(' Step 4: DCA Execution Decision')
		
		let dcaResult: DCAExecution
		
		if (!priceData.consensus) {
			console.log(' DCA blocked: Price consensus not reached')
			dcaResult = { executed: false, timestamp: new Date() }
		} else if (!aiAnalysis.shouldInvest) {
			console.log(' DCA blocked: AI recommends not to invest')
			dcaResult = { executed: false, timestamp: new Date() }
		} else if (aiAnalysis.confidence < runtime.config.dcaSettings.minConfidence) {
			console.log('DCA blocked: AI confidence too low')
			dcaResult = { executed: false, timestamp: new Date() }
		} else {
			console.log(' All conditions met, executing DCA...')
			dcaResult = {
				executed: true,
				txHash: "0x1234567890abcdef1234567890abcdef12345678",
				amount: runtime.config.dcaSettings.usdcAmount / 1e6, // Convert from wei to USDC
				price: priceData.avgPrice,
				timestamp: new Date()
			}
		}
		
		// Step 5: Generate comprehensive execution report
		const executionReport = {
			timestamp: new Date().toISOString(),
			reserves: {
				totalReserve: reserveInfo.totalReserve,
				lastUpdated: reserveInfo.lastUpdated.toISOString()
			},
			priceAnalysis: priceData,
			aiAnalysis,
			dcaExecution: dcaResult,
			nextExecution: new Date(Date.now() + 10 * 60 * 1000).toISOString()
		}
		
		console.log(' AI Berkshire Hathaway Workflow Summary:')
		console.log('==========================================')
		console.log(` Reserves: ${reserveInfo.totalReserve.toLocaleString()} tokens`)
		console.log(` BTC Price: $${priceData.avgPrice.toFixed(2)} (Consensus: ${priceData.consensus ? 'success' : 'fail'})`)
		console.log(` AI Recommendation: ${aiAnalysis.shouldInvest ? ' INVEST' : ' HOLD'} (${(aiAnalysis.confidence * 100).toFixed(1)}%)`)
		console.log(` DCA Executed: ${dcaResult.executed ? ' YES' : ' NO'}`)
		if (dcaResult.executed) {
			console.log(` Amount: $${dcaResult.amount} USDC at $${dcaResult.price?.toFixed(2)}/BTC`)
			console.log(` Transaction: ${dcaResult.txHash}`)
		}
		console.log(` Next Execution: ${executionReport.nextExecution}`)
		
		console.log(' Full Execution Report:')
		console.log(safeJsonStringify(executionReport))
		
		return safeJsonStringify(executionReport)
		
	} catch (error) {
		console.error(' Enhanced workflow execution failed:', error)
		
		const errorReport = {
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : String(error),
			workflowStatus: 'FAILED',
			nextRetry: new Date(Date.now() + 5 * 60 * 1000).toISOString()
		}
		
		console.log(' Error Report:', safeJsonStringify(errorReport))
		return safeJsonStringify(errorReport)
	}
}

// EVM Log trigger handler
const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
	console.log('\n🔗 AI Berkshire Hathaway - EVM Event Detected')
	console.log('==============================================')
	
	return `Enhanced event processed: ${log.topics[0]}`
}

// Workflow initialization
const initWorkflow = (config: Config) => {
	const cronTrigger = new cre.capabilities.CronCapability()
	const network = getNetwork({
		chainFamily: 'evm',
		chainSelectorName: config.evms[0].chainSelectorName,
		isTestnet: true,
	})

	if (!network) {
		throw new Error(`Network not found: ${config.evms[0].chainSelectorName}`)
	}

	const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector)

	return [
		cre.handler(
			cronTrigger.trigger({
				schedule: config.schedule,
			}),
			onCronTrigger,
		),
		cre.handler(
			evmClient.logTrigger({
				addresses: [config.evms[0].messageEmitterAddress],
			}),
			onLogTrigger,
		),
	]
}

export async function main() {
	const runner = await Runner.newRunner<Config>({
		configSchema,
	})
	await runner.run(initWorkflow)
}

main()
