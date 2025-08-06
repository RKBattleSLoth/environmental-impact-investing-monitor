import React from 'react';

const Briefs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Briefs</h1>
          <p className="mt-2 text-gray-600">
            AI-powered summaries of environmental impact investing news
          </p>
        </div>

        {/* Today's Brief */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Today's Brief - {new Date().toLocaleDateString()}
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                Latest
              </span>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                <em>Generating today's brief from environmental finance sources...</em>
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
                <p className="text-gray-600 mb-4">
                  Environmental impact investing continues to show strong momentum across multiple sectors. 
                  Key developments include new regulatory frameworks, innovative financing mechanisms, 
                  and growing institutional adoption.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">Key Developments</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Carbon credit markets showing increased volatility</li>
                  <li>New green bond issuances up 15% this quarter</li>
                  <li>ESG fund flows maintaining positive trajectory</li>
                  <li>Policy updates from major carbon pricing jurisdictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Briefs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Briefs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (index + 1));
              
              return (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Brief - {date.toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {12 + Math.floor(Math.random() * 8)} articles • Generated at 7:00 AM
                      </p>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                      View Brief
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Briefs;