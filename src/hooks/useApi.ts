import { useState, useEffect, useCallback } from 'react';
import { apiService, ApiError } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useApi<T>(endpoint: string, dependencies: unknown[] = []): UseApiState<T> {
  const [state, setState] = useState<Omit<UseApiState<T>, 'retry'>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    let isMounted = true;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await apiService.get<T>(endpoint);
      
      if (isMounted) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (isMounted) {
        setState({
          data: null,
          loading: false,
          error: error instanceof ApiError ? error : new ApiError(0, 'Unknown error occurred'),
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dependencies]);

  return { ...state, retry: fetchData };
}

interface UseApiMutationState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  mutate: (endpoint: string, data?: unknown, method?: 'POST' | 'PUT' | 'DELETE') => Promise<T>;
  reset: () => void;
}

export function useApiMutation<T, P = unknown>(): UseApiMutationState<T> {
  const [state, setState] = useState<Omit<UseApiMutationState<T>, 'mutate' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = async (
    endpoint: string,
    data?: P,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<T> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let result: T;
      switch (method) {
        case 'POST':
          result = await apiService.post<T>(endpoint, data);
          break;
        case 'PUT':
          result = await apiService.put<T>(endpoint, data);
          break;
        case 'DELETE':
          result = await apiService.delete<T>(endpoint);
          break;
      }
      
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, 'Unknown error occurred');
      setState({
        data: null,
        loading: false,
        error: apiError,
      });
      throw apiError;
    }
  };

  const reset = () => {
    setState({ data: null, loading: false, error: null });
  };

  return { ...state, mutate, reset };
}