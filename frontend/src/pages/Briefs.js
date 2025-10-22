import React, { useState, useEffect } from 'react';
import { briefsAPI } from '../services/api';
import { useLocation } from 'react-router-dom';

const Briefs = () => {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const dateParam = searchParams.get('date');

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

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        const response = await briefsAPI.getBriefs();
        const normalized = (response.data || []).map((brief) => ({
          ...brief,
          content: normalizeBriefContent(brief.content),
          top_categories: brief.top_categories || brief.topCategories || []
        }));
        setBriefs(normalized);
      } catch (err) {
        setError('Failed to load briefs');
        console.error('Error fetching briefs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefs();
  }, []);

  useEffect(() => {
    if (!briefs || briefs.length === 0) {
      return;
    }

    if (dateParam) {
      const matchedBrief = briefs.find((brief) => brief.brief_date === dateParam);
      if (matchedBrief) {
        setSelectedBrief(matchedBrief);
        return;
      }
    }

    setSelectedBrief((current) => current || briefs[0]);
  }, [briefs, dateParam]);

  const activeBriefContent = selectedBrief?.content || null;
  const formattedSelectedDate = selectedBrief ? new Date(selectedBrief.brief_date).toLocaleDateString() : '';

  const renderArticleLinks = (links = []) => {
    if (!Array.isArray(links) || links.length === 0) {
      return null;
    }

    return (
      <div className="mt-8">
        <h4 className="font-semibold text-gray-900 mb-3">Source Articles</h4>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.url} className="text-sm text-gray-600">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {link.title}
              </a>
              {link.source && <span className="text-gray-400"> · {link.source}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderKeyDevelopments = (developments = []) => {
    if (!Array.isArray(developments) || developments.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 mb-3">Key Developments</h4>
        <div className="space-y-4">
          {developments.map((item, index) => (
            <div key={`${item.title}-${index}`} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-base font-semibold text-gray-900">
                  {item.title}
                </h5>
                {item.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {item.category.replace(/-/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Briefs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered summaries of environmental impact investing news
          </p>
        </div>

        {/* Latest Brief */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 px-6 py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading latest brief...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg shadow mb-8 px-6 py-4">
            <p className="text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}

        {selectedBrief && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {activeBriefContent?.headline || `Daily Brief – ${formattedSelectedDate}`}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formattedSelectedDate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {selectedBrief.article_count} articles
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {selectedBrief.ai_model_used || 'AI Generated'}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="prose max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {activeBriefContent?.executiveSummary && (
                    <p className="text-base whitespace-pre-line">
                      {activeBriefContent.executiveSummary}
                    </p>
                  )}

                  {renderKeyDevelopments(activeBriefContent?.keyDevelopments)}

                  {activeBriefContent?.marketImplications && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Market Implications</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {activeBriefContent.marketImplications}
                      </p>
                    </div>
                  )}

                  {activeBriefContent?.investmentOutlook && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Investment Outlook</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {activeBriefContent.investmentOutlook}
                      </p>
                    </div>
                  )}

                  {renderArticleLinks(activeBriefContent?.articleLinks)}
                </div>
                {selectedBrief.top_categories && selectedBrief.top_categories.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBrief.top_categories.map((category, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                          {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Briefs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Briefs</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {briefs.length === 0 && !loading && (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No briefs available yet. New briefs are generated daily at 7:00 AM.
              </div>
            )}
            {briefs.map((brief) => (
              <div key={brief.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {brief.content?.headline || `Brief - ${new Date(brief.brief_date).toLocaleDateString()}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {brief.article_count} articles • Generated {new Date(brief.generated_at).toLocaleString()}
                    </p>
                    {brief.content?.executiveSummary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {brief.content.executiveSummary}
                      </p>
                    )}
                    {brief.top_categories && brief.top_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {brief.top_categories.slice(0, 3).map((category, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {category.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedBrief(brief)}
                    className={`font-medium px-4 py-2 rounded transition-colors ${
                      selectedBrief?.id === brief.id 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {selectedBrief?.id === brief.id ? 'Currently Viewing' : 'View Brief'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Briefs;