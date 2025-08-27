import React, { useState, useEffect } from 'react';
import { briefsAPI } from '../services/api';

const Briefs = () => {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrief, setSelectedBrief] = useState(null);

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        const response = await briefsAPI.getBriefs();
        setBriefs(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedBrief(response.data[0]); // Set the latest brief as default
        }
      } catch (err) {
        setError('Failed to load briefs');
        console.error('Error fetching briefs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefs();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Briefs</h1>
          <p className="mt-2 text-gray-600">
            AI-powered summaries of environmental impact investing news
          </p>
        </div>

        {/* Latest Brief */}
        {loading && (
          <div className="bg-white rounded-lg shadow mb-8 px-6 py-8 text-center">
            <p className="text-gray-600">Loading latest brief...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow mb-8 px-6 py-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {selectedBrief && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Brief - {new Date(selectedBrief.brief_date).toLocaleDateString()}
                </h2>
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
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {selectedBrief.content}
                </div>
                {selectedBrief.top_categories && selectedBrief.top_categories.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Key Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBrief.top_categories.map((category, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Briefs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {briefs.length === 0 && !loading && (
              <div className="px-6 py-8 text-center text-gray-500">
                No briefs available yet. New briefs are generated daily at 7:00 AM.
              </div>
            )}
            {briefs.map((brief) => (
              <div key={brief.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Brief - {new Date(brief.brief_date).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {brief.article_count} articles • Generated {new Date(brief.generated_at).toLocaleString()}
                    </p>
                    {brief.top_categories && brief.top_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {brief.top_categories.slice(0, 3).map((category, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
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
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
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