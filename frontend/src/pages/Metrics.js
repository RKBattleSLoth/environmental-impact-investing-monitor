import React from 'react';

const Metrics = () => {
  // Mock metrics data for the 18 core metrics from the PRD
  const metrics = [
    { 
      name: 'Climate Tech Venture Funding', 
      value: '$12.8B', 
      change: '+15%', 
      period: 'Q3 2024',
      trend: 'up'
    },
    { 
      name: 'Climate Tech Deal Count', 
      value: '847', 
      change: '+8%', 
      period: 'Monthly',
      trend: 'up'
    },
    { 
      name: 'Green Bond Issuance', 
      value: '$156B', 
      change: '+22%', 
      period: 'YTD 2024',
      trend: 'up'
    },
    { 
      name: 'ESG Fund Flows', 
      value: '$89.2B', 
      change: '-3%', 
      period: 'Monthly',
      trend: 'down'
    },
    { 
      name: 'Clean Energy Stock Index', 
      value: '1,245', 
      change: '+5.2%', 
      period: 'Daily',
      trend: 'up'
    },
    { 
      name: 'Carbon Credit Market Volume', 
      value: '450M tonnes', 
      change: '+12%', 
      period: 'Monthly',
      trend: 'up'
    },
    { 
      name: 'Climate Patent Filings', 
      value: '2,847', 
      change: '+18%', 
      period: 'Quarterly',
      trend: 'up'
    },
    { 
      name: 'Corporate Net-Zero Commitments', 
      value: '1,256', 
      change: '+9%', 
      period: 'Monthly',
      trend: 'up'
    },
    { 
      name: 'Renewable Energy Capacity', 
      value: '385 GW', 
      change: '+28%', 
      period: 'Quarterly',
      trend: 'up'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Key Metrics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            18 core ecosystem metrics for environmental impact investing
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {metric.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  metric.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500">
                  {metric.period}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Investment Categories</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Clean Energy</span>
                </div>
                <span className="font-semibold">$45.2B</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Carbon Management</span>
                </div>
                <span className="font-semibold">$18.7B</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Sustainable Agriculture</span>
                </div>
                <span className="font-semibold">$12.4B</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Circular Economy</span>
                </div>
                <span className="font-semibold">$8.9B</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Regional Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">North America</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                  <span className="font-semibold text-sm">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Europe</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                  <span className="font-semibold text-sm">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Asia-Pacific</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '12%'}}></div>
                  </div>
                  <span className="font-semibold text-sm">12%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Other</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '3%'}}></div>
                  </div>
                  <span className="font-semibold text-sm">3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;