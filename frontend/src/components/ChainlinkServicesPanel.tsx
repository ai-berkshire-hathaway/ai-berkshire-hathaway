import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Link, 
  Shuffle, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Database,
  Lock,
  Globe,
  Zap
} from 'lucide-react';

interface PoRData {
  asset: string;
  totalReserves: string;
  lastUpdated: Date;
  status: 'verified' | 'warning' | 'error';
  attestationCount: number;
  collateralizationRatio: number;
}

interface ChainlinkService {
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive';
  description: string;
  lastUpdate: Date;
  data?: any;
}

export function ChainlinkServicesPanel() {
  const [porData, setPorData] = useState<PoRData[]>([
    {
      asset: 'USDC',
      totalReserves: '1,234,567,890.50',
      lastUpdated: new Date(),
      status: 'verified',
      attestationCount: 12,
      collateralizationRatio: 100.2
    },
    {
      asset: 'WBTC',
      totalReserves: '45,678.12345678',
      lastUpdated: new Date(Date.now() - 300000), // 5 minutes ago
      status: 'verified',
      attestationCount: 8,
      collateralizationRatio: 101.5
    }
  ]);

  const [chainlinkServices, setChainlinkServices] = useState<ChainlinkService[]>([
    {
      name: 'Price Feeds',
      icon: <TrendingUp className="h-5 w-5" />,
      status: 'active',
      description: 'Real-time BTC/USD price data',
      lastUpdate: new Date(),
      data: { price: '$67,234.56', heartbeat: '1 hour' }
    },
    {
      name: 'VRF (Randomness)',
      icon: <Shuffle className="h-5 w-5" />,
      status: 'active',
      description: 'Verifiable random execution timing',
      lastUpdate: new Date(Date.now() - 120000), // 2 minutes ago
      data: { requests: 23, fulfilled: 23 }
    },
    {
      name: 'CCIP (Cross-Chain)',
      icon: <Link className="h-5 w-5" />,
      status: 'active',
      description: 'Cross-chain DCA execution',
      lastUpdate: new Date(Date.now() - 600000), // 10 minutes ago
      data: { chains: 3, messages: 156 }
    },
    {
      name: 'Proof of Reserve',
      icon: <Shield className="h-5 w-5" />,
      status: 'active',
      description: 'Asset reserve verification',
      lastUpdate: new Date(Date.now() - 180000), // 3 minutes ago
      data: { assets: 2, verified: '100%' }
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update timestamps
    setPorData(prev => prev.map(item => ({
      ...item,
      lastUpdated: new Date()
    })));
    
    setChainlinkServices(prev => prev.map(service => ({
      ...service,
      lastUpdate: new Date()
    })));
    
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'inactive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="h-6 w-6 mr-2 text-blue-600" />
            Chainlink Services
          </h2>
          <p className="text-gray-600 mt-1">
            Decentralized oracle network powering our DCA system
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Chainlink Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chainlinkServices.map((service, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-blue-600">{service.icon}</div>
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
                <span className="ml-1 capitalize">{service.status}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
            {service.data && (
              <div className="text-xs text-gray-500 space-y-1">
                {Object.entries(service.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Updated {service.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Proof of Reserve Section */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Proof of Reserve (PoR)</h3>
                <p className="text-sm text-gray-600">Real-time asset reserve verification</p>
              </div>
            </div>
            <a
              href="https://docs.chain.link/data-feeds/proof-of-reserve"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Learn More
            </a>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {porData.map((reserve, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-gray-700">{reserve.asset}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{reserve.asset} Reserves</h4>
                      <p className="text-sm text-gray-600">Collateralized asset backing</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(reserve.status)}`}>
                    {getStatusIcon(reserve.status)}
                    <span className="ml-1 capitalize">{reserve.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Total Reserves</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{reserve.totalReserves}</p>
                    <p className="text-xs text-gray-500">{reserve.asset}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Attestations</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{reserve.attestationCount}</p>
                    <p className="text-xs text-gray-500">Node verifications</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Collateral Ratio</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">{reserve.collateralizationRatio}%</p>
                    <p className="text-xs text-gray-500">Over-collateralized</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last verification:</span>
                    <span className="font-medium text-gray-900">
                      {reserve.lastUpdated.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PoR Explanation */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">How Proof of Reserve Works</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Cryptographic Verification:</strong> Uses Merkle trees to prove asset holdings</li>
                  <li>• <strong>Decentralized Network:</strong> Multiple Chainlink nodes verify reserves independently</li>
                  <li>• <strong>Real-time Updates:</strong> Continuous monitoring ensures data freshness</li>
                  <li>• <strong>Transparency:</strong> Public verification of custodial asset backing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
