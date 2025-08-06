import React from 'react';
import { useBriefs, useCarbonPrices, useMetrics } from '../hooks/useAPI';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

const Dashboard = () => {
  const { data: briefs, isLoading: briefsLoading, error: briefsError } = useBriefs({ limit: 1 });
  const { data: prices, isLoading: pricesLoading } = useCarbonPrices();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();

  const todaysBrief = briefs?.data?.[0];

  // Prepare chart data for carbon prices
  const chartData = React.useMemo(() => {
    if (!prices?.data) return null;

    const markets = Object.keys(prices.data);
    const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'];
    
    return {
      labels: ['Current'], // Simplified for current prices
      datasets: markets.map((market, index) => ({
        label: market.toUpperCase().replace('_', ' '),
        data: [prices.data[market].current],
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1,
      }))
    };
  }, [prices]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Environmental Impact Investing Monitor
          </h1>
          <p className="mt-2 text-gray-600">
            Real-time intelligence for environmental impact investors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Brief */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Today's Brief
                </h2>
                {todaysBrief && (
                  <span className="text-sm text-gray-500">
                    {format(new Date(todaysBrief.brief_date), 'MMMM d, yyyy')}
                  </span>
                )}
              </div>
              
              {briefsLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ) : briefsError ? (
                <div className="text-red-600">
                  <p>Failed to load today's brief. Please try again later.</p>
                </div>
              ) : todaysBrief ? (
                <div className="prose max-w-none">
                  <div className="text-sm text-gray-600 mb-3">
                    {todaysBrief.article_count} articles • Generated with {todaysBrief.ai_model_used || 'AI'}
                  </div>
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: todaysBrief.content?.replace(/\n/g, '<br/>').slice(0, 500) + '...' 
                    }}
                  />
                  <div className="mt-4">
                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                      Read Full Brief →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <p>No brief available for today. Check back later.</p>
                </div>
              )}
            </div>

            {/* Carbon Price Chart */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Carbon Price Tracking
              </h2>
              {pricesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : chartData ? (
                <div className="h-64">
                  <Line 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Current Carbon Prices by Market'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          title: {
                            display: true,
                            text: 'Price (Local Currency)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Carbon price data unavailable
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Key Metrics
              </h2>
              {pricesLoading || metricsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {prices?.data && Object.entries(prices.data).map(([market, data]) => (
                    <div key={market} className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {market.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className="font-semibold">
                        {data.current} {data.currency}
                      </span>
                    </div>
                  ))}
                  
                  {metrics?.data?.slice(0, 3).map((metric) => (
                    <div key={metric.metric_name} className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">
                        {metric.metric_name.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-semibold text-sm">
                        {typeof metric.value === 'number' 
                          ? metric.value.toLocaleString() 
                          : metric.value
                        } {metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Data Collection Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">AI Processing Online</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">
                    {prices?.data ? Object.keys(prices.data).length : 0} Markets Tracked
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">
                    {metrics?.data?.length || 0} Metrics Monitored
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;