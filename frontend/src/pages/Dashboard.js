import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBriefs, useCarbonPrices, useMetrics } from '../hooks/useAPI';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: briefs, isLoading: briefsLoading, error: briefsError } = useBriefs({ limit: 1 });
  const { data: prices, isLoading: pricesLoading } = useCarbonPrices();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();

  const todaysBrief = briefs?.data?.[0];

  const parsedBriefContent = React.useMemo(() => {
    if (!todaysBrief?.content) {
      return null;
    }

    const rawContent = todaysBrief.content;

    if (typeof rawContent === 'object') {
      return {
        headline: rawContent.headline || '',
        executiveSummary: rawContent.executiveSummary || rawContent.summary || '',
        keyDevelopments: Array.isArray(rawContent.keyDevelopments) ? rawContent.keyDevelopments : [],
        marketImplications: rawContent.marketImplications || '',
        investmentOutlook: rawContent.investmentOutlook || '',
        articleLinks: Array.isArray(rawContent.articleLinks) ? rawContent.articleLinks : [],
      };
    }

    if (typeof rawContent === 'string') {
      try {
        const parsed = JSON.parse(rawContent);
        return {
          headline: parsed.headline || '',
          executiveSummary: parsed.executiveSummary || parsed.summary || rawContent,
          keyDevelopments: Array.isArray(parsed.keyDevelopments) ? parsed.keyDevelopments : [],
          marketImplications: parsed.marketImplications || '',
          investmentOutlook: parsed.investmentOutlook || '',
          articleLinks: Array.isArray(parsed.articleLinks) ? parsed.articleLinks : [],
        };
      } catch (error) {
        return {
          headline: '',
          executiveSummary: rawContent,
          keyDevelopments: [],
          marketImplications: '',
          investmentOutlook: '',
          articleLinks: [],
        };
      }
    }

    return null;
  }, [todaysBrief?.content]);

  // Prepare chart data for carbon prices
  const chartData = React.useMemo(() => {
    if (!prices?.data) return null;

    const markets = Object.keys(prices.data);
    const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'];
    
    return {
      labels: markets.map(market => {
        const marketName = market.toUpperCase().replace('_', ' ');
        const marketMap = {
          'EU ETS': 'EU ETS',
          'CALIFORNIA': 'California',
          'UK ETS': 'UK ETS',
          'RGGI': 'RGGI'
        };
        return marketMap[marketName] || marketName;
      }),
      datasets: [{
        label: 'Current Price',
        data: markets.map(market => prices.data[market].current),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
      }]
    };
  }, [prices]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Environmental Impact Investing Monitor
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time intelligence for environmental impact investors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Brief */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Brief
                </h2>
                {todaysBrief && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(todaysBrief.brief_date), 'MMMM d, yyyy')}
                  </span>
                )}
              </div>
              
              {briefsLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : briefsError ? (
                <div className="text-red-600 dark:text-red-400">
                  <p>Failed to load today's brief. Please try again later.</p>
                </div>
              ) : todaysBrief ? (
                <div className="prose max-w-none">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {todaysBrief.article_count} articles • Generated with {todaysBrief.ai_model_used || 'AI'}
                  </div>
                  {parsedBriefContent?.headline && (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {parsedBriefContent.headline}
                    </h3>
                  )}
                  {parsedBriefContent?.executiveSummary && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {parsedBriefContent.executiveSummary.length > 600
                        ? `${parsedBriefContent.executiveSummary.slice(0, 600)}…`
                        : parsedBriefContent.executiveSummary}
                    </p>
                  )}

                  {parsedBriefContent?.keyDevelopments?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                        Key Developments
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {parsedBriefContent.keyDevelopments.slice(0, 3).map((item, index) => (
                          <li key={`${item.title}-${index}`} className="border border-gray-100 dark:border-gray-700 rounded-md p-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.title || `Development ${index + 1}`}
                            </p>
                            {item.detail && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">
                                {item.detail}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedBriefContent?.articleLinks?.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {parsedBriefContent.articleLinks.length}
                      </span>{' '}
                      source {parsedBriefContent.articleLinks.length === 1 ? 'article' : 'articles'} referenced
                    </div>
                  )}

                  <div className="mt-4">
                    <button 
                      onClick={() => navigate('/briefs')}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      Read Full Brief →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">
                  <p>No brief available for today. Check back later.</p>
                </div>
              )}
            </div>

            {/* Carbon Price Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Carbon Price Tracking
              </h2>
              {pricesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-500"></div>
                </div>
              ) : chartData ? (
                <div>
                  <div className="h-64">
                    <Bar 
                      data={chartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          title: {
                            display: true,
                            text: 'Current Carbon Prices by Market'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Price (Local Currency)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Carbon Markets'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {Object.entries(prices.data || {}).map(([market, data]) => (
                      <div key={market} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {market.toUpperCase().replace('_', ' ')}
                        </div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                          {data.current.toFixed(2)} {data.currency}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Volume: {parseInt(data.volume).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Updated: {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Carbon price data unavailable
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Key Metrics
              </h2>
              {pricesLoading || metricsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {prices?.data && Object.entries(prices.data).map(([market, data]) => (
                    <div key={market} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        {market.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className="font-semibold dark:text-white">
                        {data.current} {data.currency}
                      </span>
                    </div>
                  ))}
                  
                  {metrics?.data?.slice(0, 3).map((metric) => (
                    <div key={metric.metric_name} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {metric.metric_name.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-semibold dark:text-white text-sm">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data Collection Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Processing Online</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {prices?.data ? Object.keys(prices.data).length : 0} Markets Tracked
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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