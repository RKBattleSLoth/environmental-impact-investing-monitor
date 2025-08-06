import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CarbonPrices = () => {
  // Mock data for carbon prices
  const carbonMarkets = [
    { name: 'EU ETS', price: 85.50, change: 2.1, currency: 'EUR', volume: '15.2M' },
    { name: 'California Cap-and-Trade', price: 28.15, change: -0.8, currency: 'USD', volume: '8.5M' },
    { name: 'RGGI', price: 13.45, change: 1.2, currency: 'USD', volume: '4.2M' },
    { name: 'UK ETS', price: 72.30, change: 3.5, currency: 'GBP', volume: '2.8M' },
  ];

  // Mock chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'EU ETS',
        data: [78, 82, 85, 83, 87, 85.5],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'California',
        data: [25, 27, 28, 26, 29, 28.15],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'RGGI',
        data: [11, 12, 13, 12.5, 14, 13.45],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Carbon Price Trends (6 Months)',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price (Local Currency)',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Carbon Price Tracking</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring of major carbon markets with historical analysis
          </p>
        </div>

        {/* Current Prices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {carbonMarkets.map((market) => (
            <div key={market.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{market.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  market.change >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {market.change >= 0 ? '+' : ''}{market.change}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current Price</span>
                  <span className="font-semibold">
                    {market.price} {market.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Volume</span>
                  <span className="text-sm">{market.volume}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Market Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Analysis</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium text-gray-900">EU ETS</h4>
                <p className="text-sm text-gray-600">
                  Strong performance driven by increased industrial demand and policy tightening.
                  Trading volume remains robust with institutional participation growing.
                </p>
              </div>
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-medium text-gray-900">California Cap-and-Trade</h4>
                <p className="text-sm text-gray-600">
                  Slight decline due to seasonal factors. Long-term outlook remains positive
                  with new sectors expected to join the program.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Global Carbon Credit Volume</span>
                <span className="font-semibold">450.2M tonnes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Price (USD)</span>
                <span className="font-semibold">$52.30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Market Cap</span>
                <span className="font-semibold">$23.5B</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">30-Day Volatility</span>
                <span className="font-semibold">12.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonPrices;