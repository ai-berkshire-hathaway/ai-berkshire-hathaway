import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock, 
  Wallet, 
  Activity,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useDCAContract } from '../hooks/useDCAContract';
import { formatUnits } from 'viem';
import { DCA_CONTRACT_ADDRESS } from '../config/contracts';
import { ChainlinkServicesPanel } from './ChainlinkServicesPanel';

export function EnhancedDCADashboard() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const {
    currentPrice,
    priceUpdatedAt,
    thresholds,
    amounts,
    executed,
    contractBalance,
    owner,
    loading,
    error
  } = useDCAContract();

  const formatPrice = (price: bigint) => {
    // Chainlink price feeds use 8 decimals
    const priceNumber = Number(formatUnits(price, 8));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(priceNumber);
  };

  const formatUSDC = (amount: bigint) => {
    // USDC uses 6 decimals
    const amountNumber = Number(formatUnits(amount, 6));
    return amountNumber.toFixed(2);
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getThresholdStatus = (threshold: bigint, executed: boolean, currentPrice?: bigint) => {
    if (executed) return 'executed';
    if (currentPrice && currentPrice <= threshold) return 'triggered';
    return 'waiting';
  };

  const totalInvested = executed.reduce((sum, isExecuted, index) => {
    if (isExecuted && amounts[index]) {
      return sum + Number(formatUnits(amounts[index], 6));
    }
    return sum;
  }, 0);

  const executionCount = executed.filter(Boolean).length;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view the DCA contract dashboard
          </p>
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Wallet className="h-5 w-5 mr-2" />
                Connect {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading DCA Contract Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Failed to load contract data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Berkshire Hathaway DCA</h1>
              <p className="text-gray-600 mt-2">
                Automated Bitcoin Dollar Cost Averaging powered by Chainlink
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Contract: {DCA_CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <Wifi className="h-4 w-4 mr-2" />
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Disconnect
              </button>
              <a
                href={`https://basescan.org/address/${DCA_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Contract
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current BTC Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentPrice ? formatPrice(currentPrice) : 'Loading...'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {priceUpdatedAt ? `Updated ${formatTime(priceUpdatedAt)}` : 'Loading...'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contract Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${contractBalance ? formatUSDC(contractBalance) : '0.00'}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">USDC available for DCA</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalInvested.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {executionCount} executions
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Thresholds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {executed.filter(e => !e).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              of {thresholds.length} total
            </p>
          </div>
        </div>

        {/* DCA Thresholds */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">DCA Thresholds</h2>
          <div className="space-y-4">
            {thresholds.map((threshold, index) => {
              const status = getThresholdStatus(threshold, executed[index], currentPrice);
              const amount = amounts[index];
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {status === 'executed' && <CheckCircle className="h-6 w-6 text-green-600" />}
                      {status === 'triggered' && <AlertCircle className="h-6 w-6 text-orange-600" />}
                      {status === 'waiting' && <Clock className="h-6 w-6 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Threshold #{index + 1}: {formatPrice(threshold)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Invest ${amount ? formatUSDC(amount) : '0'} USDC when BTC ≤ {formatPrice(threshold)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'executed' 
                        ? 'bg-green-100 text-green-800'
                        : status === 'triggered'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {status === 'executed' ? 'Executed' : 
                       status === 'triggered' ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chainlink Services Panel */}
        <ChainlinkServicesPanel />

        {/* Contract Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Contract Owner</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {owner || 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Your Address</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {address}
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Live Contract Data</p>
                <p className="text-sm text-blue-700">
                  This dashboard displays real-time data from the deployed DCA contract on Base mainnet.
                  All price feeds are powered by Chainlink oracles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
