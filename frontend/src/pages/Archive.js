import React, { useState } from 'react';

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  const categories = [
    'all',
    'venture-capital',
    'public-markets',
    'carbon-markets',
    'policy-regulation',
    'technology',
    'biodiversity',
    'esg-sustainability'
  ];

  // Mock archive data
  const archiveItems = [
    {
      id: 1,
      type: 'brief',
      title: 'Daily Brief - December 1, 2024',
      summary: 'Comprehensive overview of environmental finance developments...',
      date: '2024-12-01',
      category: 'daily-brief',
      articles: 15
    },
    {
      id: 2,
      type: 'article',
      title: 'EU Carbon Prices Surge on Policy Announcement',
      summary: 'European carbon allowances jumped 5% following new regulatory framework...',
      date: '2024-11-30',
      category: 'carbon-markets',
      source: 'Carbon Pulse'
    },
    {
      id: 3,
      type: 'article',
      title: 'Climate Tech Funding Reaches Record Highs in Q3',
      summary: 'Venture capital investment in climate technology companies...',
      date: '2024-11-29',
      category: 'venture-capital',
      source: 'Environmental Finance'
    },
    {
      id: 4,
      type: 'brief',
      title: 'Daily Brief - November 30, 2024',
      summary: 'Key developments in green bonds, carbon pricing...',
      date: '2024-11-30',
      category: 'daily-brief',
      articles: 18
    },
    {
      id: 5,
      type: 'article',
      title: 'New Biodiversity Credit Market Launches',
      summary: 'Major conservation organization announces new marketplace...',
      date: '2024-11-28',
      category: 'biodiversity',
      source: 'ESG Today'
    }
  ];

  const filteredItems = archiveItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    // Simple date filtering (in real app, would be more sophisticated)
    const matchesDate = true; // Simplified for demo
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
          <p className="mt-2 text-gray-600">
            Search and explore historical briefs and articles
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles and briefs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="daily-brief">Daily Briefs</option>
                <option value="venture-capital">Venture Capital</option>
                <option value="public-markets">Public Markets</option>
                <option value="carbon-markets">Carbon Markets</option>
                <option value="policy-regulation">Policy & Regulation</option>
                <option value="technology">Technology</option>
                <option value="biodiversity">Biodiversity</option>
                <option value="esg-sustainability">ESG & Sustainability</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredItems.length} Results
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full mr-3 ${
                        item.type === 'brief' 
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type === 'brief' ? 'Daily Brief' : 'Article'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      {item.source && (
                        <>
                          <span className="text-gray-300 mx-2">•</span>
                          <span className="text-sm text-gray-500">{item.source}</span>
                        </>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 cursor-pointer">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {item.summary}
                    </p>
                    
                    {item.articles && (
                      <span className="text-sm text-gray-500">
                        {item.articles} articles included
                      </span>
                    )}
                  </div>
                  
                  <button className="ml-4 text-primary-600 hover:text-primary-700 font-medium">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No results found. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Archive;