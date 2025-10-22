import React, { useEffect, useMemo, useState } from 'react';
import { useBriefs } from '../hooks/useAPI';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const parseBriefDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatBriefDate = (value) => {
  const date = parseBriefDate(value);
  return date ? format(date, 'MMMM d, yyyy') : 'Unknown date';
};

const normalizeBriefContent = (content) => {
  if (!content) {
    return null;
  }

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (error) {
      return {
        headline: '',
        executiveSummary: content,
        keyDevelopments: [],
        marketImplications: '',
        investmentOutlook: '',
        sentiment: 'neutral',
        articleLinks: []
      };
    }
  }

  return {
    headline: '',
    executiveSummary: '',
    keyDevelopments: [],
    marketImplications: '',
    investmentOutlook: '',
    sentiment: 'neutral',
    articleLinks: [],
    ...content
  };
};

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const query = { page, limit: 10 };
    if (selectedDate) {
      query.date = selectedDate;
    }
    return query;
  }, [page, selectedDate]);

  const { data, isLoading, isError, error } = useBriefs(params);

  const briefs = useMemo(() => {
    return (data?.data || []).map((brief) => ({
      ...brief,
      content: normalizeBriefContent(brief.content),
      top_categories: brief.top_categories || brief.topCategories || []
    }));
  }, [data?.data]);
  const pagination = data?.pagination;
  const totalPages = pagination ? pagination.totalPages : 1;

  const filteredBriefs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return briefs.filter(brief => {
      const date = parseBriefDate(brief.brief_date);
      const formattedDate = date ? format(date, 'MMMM d, yyyy') : '';
      const content = brief.content || {};
      const developmentText = Array.isArray(content.keyDevelopments)
        ? content.keyDevelopments.map(item => `${item.title || ''} ${item.detail || ''}`).join(' ')
        : '';

      const searchableText = `${formattedDate} ${content.headline || ''} ${content.executiveSummary || ''} ${developmentText}`.toLowerCase();

      const matchesSearch = query ? searchableText.includes(query) : true;
      const matchesCategory = selectedCategory === 'all' ? true : selectedCategory === 'daily-brief';

      return matchesSearch && matchesCategory;
    });
  }, [briefs, searchTerm, selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setPage(1);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (!pagination) return;
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Archive</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Search and explore historical briefs and articles
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles and briefs..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="daily-brief">Daily Briefs</option>
              </select>
            </div>

            {/* Date Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by Date
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isLoading ? 'Loading results...' : `${pagination?.total || 0} Results`}
            </h2>
          </div>
          
          {isError && (
            <div className="px-6 py-12 text-center">
              <p className="text-red-500 dark:text-red-400">Failed to load archive: {error?.error || error?.message}</p>
            </div>
          )}

          {!isError && (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Loading archive...</p>
                  </div>
                )}

                {!isLoading && filteredBriefs.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No results found. Try adjusting your search criteria.</p>
                  </div>
                )}

                {!isLoading && filteredBriefs.map((brief) => (
                  <div key={brief.id} className="px-6 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full mr-3 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                            Daily Brief
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatBriefDate(brief.brief_date)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 mx-2">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {brief.article_count} articles
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {brief.content?.headline || `Daily Brief – ${formatBriefDate(brief.brief_date)}`}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-line">
                          {brief.content?.executiveSummary
                            ? `${brief.content.executiveSummary.slice(0, 400)}${brief.content.executiveSummary.length > 400 ? '…' : ''}`
                            : 'No summary available.'}
                        </p>

                        {Array.isArray(brief.top_categories) && brief.top_categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {brief.top_categories.map((category) => (
                              <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/briefs?date=${brief.brief_date}`}
                        className="ml-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || isLoading}
                    className={`px-4 py-2 rounded-md border ${page === 1 || isLoading ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed' : 'text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900'}`}
                  >
                    Previous
                  </button>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || isLoading || (pagination && !pagination.hasNext)}
                    className={`px-4 py-2 rounded-md border ${page === totalPages || isLoading || (pagination && !pagination.hasNext) ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed' : 'text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Archive;