import { useQuery, useMutation, useQueryClient } from 'react-query';
import { briefsAPI, carbonPricesAPI, metricsAPI, searchAPI } from '../services/api';
import toast from 'react-hot-toast';

// Custom hooks for API data fetching

export const useBriefs = (params = {}) => {
  return useQuery(
    ['briefs', params],
    () => briefsAPI.getBriefs(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      onError: (error) => {
        toast.error(`Failed to fetch briefs: ${error.error || error.message}`);
      }
    }
  );
};

export const useBriefByDate = (date) => {
  return useQuery(
    ['brief', date],
    () => briefsAPI.getBriefByDate(date),
    {
      enabled: !!date,
      staleTime: 30 * 60 * 1000, // 30 minutes
      onError: (error) => {
        if (error.status !== 404) {
          toast.error(`Failed to fetch brief: ${error.error || error.message}`);
        }
      }
    }
  );
};

export const useGenerateBrief = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    briefsAPI.generateBrief,
    {
      onSuccess: (data) => {
        toast.success('Brief generated successfully');
        queryClient.invalidateQueries(['briefs']);
        queryClient.invalidateQueries(['brief']);
      },
      onError: (error) => {
        toast.error(`Failed to generate brief: ${error.error || error.message}`);
      }
    }
  );
};

export const useCarbonPrices = () => {
  return useQuery(
    'carbonPrices',
    carbonPricesAPI.getCurrentPrices,
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
      refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
      retry: 3,
      onError: (error) => {
        toast.error(`Failed to fetch carbon prices: ${error.error || error.message}`);
      }
    }
  );
};

export const useHistoricalPrices = (params = {}) => {
  return useQuery(
    ['historicalPrices', params],
    () => carbonPricesAPI.getHistoricalPrices(params),
    {
      enabled: Object.keys(params).length > 0,
      staleTime: 30 * 60 * 1000, // 30 minutes
      onError: (error) => {
        toast.error(`Failed to fetch historical prices: ${error.error || error.message}`);
      }
    }
  );
};

export const useTrendAnalysis = (params = {}) => {
  return useQuery(
    ['trendAnalysis', params],
    () => carbonPricesAPI.getTrendAnalysis(params),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      onError: (error) => {
        toast.error(`Failed to fetch trend analysis: ${error.error || error.message}`);
      }
    }
  );
};

export const useMetrics = () => {
  return useQuery(
    'metrics',
    metricsAPI.getCurrentMetrics,
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      refetchInterval: 60 * 60 * 1000, // Auto-refresh every hour
      retry: 2,
      onError: (error) => {
        toast.error(`Failed to fetch metrics: ${error.error || error.message}`);
      }
    }
  );
};

export const useHistoricalMetrics = (params = {}) => {
  return useQuery(
    ['historicalMetrics', params],
    () => metricsAPI.getHistoricalMetrics(params),
    {
      enabled: Object.keys(params).length > 0,
      staleTime: 2 * 60 * 60 * 1000, // 2 hours
      onError: (error) => {
        toast.error(`Failed to fetch historical metrics: ${error.error || error.message}`);
      }
    }
  );
};

export const useSearch = (params, options = {}) => {
  return useQuery(
    ['search', params],
    () => searchAPI.searchContent(params),
    {
      enabled: !!params.q && params.q.length >= 3,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        toast.error(`Search failed: ${error.error || error.message}`);
      },
      ...options
    }
  );
};