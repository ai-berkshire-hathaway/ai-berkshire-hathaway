import React, { useState, useEffect } from 'react';
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
  CheckCircle
} from 'lucide-react';

// 类型定义
interface DCAStats {
  currentPrice: number;
  priceUpdatedAt: number;
  thresholds: number[];
  amounts: number[];
  executed: boolean[];
  contractBalance: number;
  totalInvested: number;
  executionCount: number;
}

interface PriceHistory {
  timestamp: number;
  price: number;
  executed?: boolean;
}

export function DCADashboard() {
  const [stats, setStats] = useState<DCAStats | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 模拟数据加载 (实际实现中会调用合约)
  useEffect(() => {
    loadDCAStats();
    const interval = setInterval(loadDCAStats, 30000); // 每30秒更新
    return () => clearInterval(interval);
  }, []);

  const loadDCAStats = async () => {
    try {
      setLoading(true);
      
      // 模拟合约调用
      const mockStats: DCAStats = {
        currentPrice: 86420.50,
        priceUpdatedAt: Date.now() - 120000, // 2分钟前
        thresholds: [86000, 82000, 79000],
        amounts: [5, 5, 5], // USDC
        executed: [true, false, false],
        contractBalance: 45.5, // USDC
        totalInvested: 5,
        executionCount: 1
      };

      setStats(mockStats);
      
      // 模拟价格历史
      const mockHistory: PriceHistory[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: Date.now() - (23 - i) * 3600000, // 24小时数据
        price: 85000 + Math.random() * 4000,
        executed: i === 20 // 模拟在某个时间点执行了DCA
      }));
      
      setPriceHistory(mockHistory);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load DCA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getThresholdStatus = (threshold: number, executed: boolean, currentPrice: number) => {
    if (executed) return 'executed';
    if (currentPrice <= threshold) return 'triggered';
    return 'waiting';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading DCA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Berkshire Hathaway DCA</h1>
              <p className="text-gray-600 mt-2">
                Automated Bitcoin Dollar Cost Averaging powered by Chainlink
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDCAStats}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <a
                href={`https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Contract
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {formatTime(lastUpdate.getTime())}
          </p>
        </div>

        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current BTC Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(stats.currentPrice)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Updated {Math.floor((Date.now() - stats.priceUpdatedAt) / 60000)}m ago
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contract Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.contractBalance.toFixed(2)}
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
                      ${stats.totalInvested.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.executionCount} executions
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Thresholds</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.thresholds.filter((_, i) => !stats.executed[i]).length}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  of {stats.thresholds.length} total
                </p>
              </div>
            </div>

            {/* DCA Thresholds */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">DCA Thresholds</h2>
              <div className="space-y-4">
                {stats.thresholds.map((threshold, index) => {
                  const status = getThresholdStatus(threshold, stats.executed[index], stats.currentPrice);
                  const amount = stats.amounts[index];
                  
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
                            Invest ${amount} USDC when BTC ≤ {formatPrice(threshold)}
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

            {/* Price Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">BTC Price History (24h)</h2>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Price chart will be displayed here</p>
                  <p className="text-sm text-gray-500">Integration with Recharts coming soon</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">DCA Executed</p>
                    <p className="text-sm text-gray-600">
                      Invested $5.00 USDC at BTC price {formatPrice(85800)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Price Update</p>
                    <p className="text-sm text-gray-600">
                      BTC price updated to {formatPrice(stats.currentPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">2 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
