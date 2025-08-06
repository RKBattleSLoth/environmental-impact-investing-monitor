import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Briefs from './pages/Briefs';
import CarbonPrices from './pages/CarbonPrices';
import Metrics from './pages/Metrics';
import Archive from './pages/Archive';

import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/briefs" element={<Briefs />} />
            <Route path="/carbon-prices" element={<CarbonPrices />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;