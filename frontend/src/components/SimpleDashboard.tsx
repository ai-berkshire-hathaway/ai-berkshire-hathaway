import React, { useState, useEffect } from 'react';

// 简化版 Dashboard，不依赖外部图标库
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

export function SimpleDashboard() {
  const [stats, setStats] = useState<DCAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadDCAStats();
    const interval = setInterval(loadDCAStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDCAStats = async () => {
    try {
      setLoading(true);
      
      // 模拟合约数据
      const mockStats: DCAStats = {
        currentPrice: 86420.50,
        priceUpdatedAt: Date.now() - 120000,
        thresholds: [86000, 82000, 79000],
        amounts: [5, 5, 5],
        executed: [true, false, false],
        contractBalance: 45.5,
        totalInvested: 5,
        executionCount: 1
      };

      setStats(mockStats);
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

  if (loading && !stats) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading DCA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '30px', 
                fontWeight: 'bold', 
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                AI Berkshire Hathaway DCA
              </h1>
              <p style={{ 
                color: '#6b7280', 
                margin: '0 0 8px 0'
              }}>
                Automated Bitcoin Dollar Cost Averaging powered by Chainlink
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                margin: 0
              }}>
                Contract: 0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={loadDCAStats}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh
              </button>
              <a
                href="https://basescan.org/address/0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                🔗 View Contract
              </a>
            </div>
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: '#9ca3af',
            margin: '8px 0 0 0'
          }}>
            Last updated: {formatTime(lastUpdate.getTime())}
          </p>
        </div>

        {stats && (
          <>
            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      Current BTC Price
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#111827',
                      margin: 0
                    }}>
                      {formatPrice(stats.currentPrice)}
                    </p>
                  </div>
                  <div style={{ fontSize: '32px' }}>📈</div>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  margin: '8px 0 0 0'
                }}>
                  Updated {Math.floor((Date.now() - stats.priceUpdatedAt) / 60000)}m ago
                </p>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      Contract Balance
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#111827',
                      margin: 0
                    }}>
                      ${stats.contractBalance.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ fontSize: '32px' }}>💰</div>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  margin: '8px 0 0 0'
                }}>
                  USDC available for DCA
                </p>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      Total Invested
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#111827',
                      margin: 0
                    }}>
                      ${stats.totalInvested.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ fontSize: '32px' }}>💵</div>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  margin: '8px 0 0 0'
                }}>
                  {stats.executionCount} executions
                </p>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      Active Thresholds
                    </p>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#111827',
                      margin: 0
                    }}>
                      {stats.thresholds.filter((_, i) => !stats.executed[i]).length}
                    </p>
                  </div>
                  <div style={{ fontSize: '32px' }}>🎯</div>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  margin: '8px 0 0 0'
                }}>
                  of {stats.thresholds.length} total
                </p>
              </div>
            </div>

            {/* DCA Thresholds */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827',
                margin: '0 0 24px 0'
              }}>
                DCA Thresholds
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.thresholds.map((threshold, index) => {
                  const executed = stats.executed[index];
                  const triggered = !executed && stats.currentPrice <= threshold;
                  const amount = stats.amounts[index];
                  
                  return (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '24px' }}>
                          {executed ? '✅' : triggered ? '⚠️' : '⏰'}
                        </div>
                        <div>
                          <p style={{ 
                            fontWeight: '500', 
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            Threshold #{index + 1}: {formatPrice(threshold)}
                          </p>
                          <p style={{ 
                            fontSize: '14px', 
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Invest ${amount} USDC when BTC ≤ {formatPrice(threshold)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: executed 
                            ? '#dcfce7' 
                            : triggered 
                            ? '#fed7aa' 
                            : '#f3f4f6',
                          color: executed 
                            ? '#166534' 
                            : triggered 
                            ? '#9a3412' 
                            : '#6b7280'
                        }}>
                          {executed ? 'Executed' : triggered ? 'Ready' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '24px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827',
                margin: '0 0 24px 0'
              }}>
                Recent Activity
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '24px' }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontWeight: '500', 
                      color: '#111827',
                      margin: '0 0 4px 0'
                    }}>
                      DCA Executed
                    </p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Invested $5.00 USDC at BTC price {formatPrice(85800)}
                    </p>
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      2 hours ago
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '24px' }}>📊</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontWeight: '500', 
                      color: '#111827',
                      margin: '0 0 4px 0'
                    }}>
                      Price Update
                    </p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      BTC price updated to {formatPrice(stats.currentPrice)}
                    </p>
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      2 minutes ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
