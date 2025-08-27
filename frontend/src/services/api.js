import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Response Error:', error.response?.data || error.message);
    }
    
    // Handle common error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unauthorized access detected');
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// API endpoints
export const briefsAPI = {
  getBriefs: (params = {}) => api.get('/briefs', { params }),
  getBriefByDate: (date) => api.get(`/briefs/${date}`),
  generateBrief: (data) => api.post('/generate/brief', data)
};

export const carbonPricesAPI = {
  getCurrentPrices: () => api.get('/carbon-prices'),
  getHistoricalPrices: (params = {}) => api.get('/carbon-prices/historical', { params }),
  getTrendAnalysis: (params = {}) => api.get('/carbon-prices/trends', { params })
};

export const metricsAPI = {
  getCurrentMetrics: () => api.get('/metrics'),
  getHistoricalMetrics: (params = {}) => api.get('/metrics/historical', { params })
};

export const searchAPI = {
  searchContent: (params) => api.get('/search', { params })
};

export const exportAPI = {
  exportData: (params) => {
    // For file downloads, we need to handle the response differently
    return axios.get(`/api/v1/generate/export`, {
      params,
      responseType: 'blob',
      timeout: 60000
    });
  }
};

export default api;