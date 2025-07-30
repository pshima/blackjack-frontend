import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi, useApiMutation } from '../useApi';
import { ApiError } from '../../services/api';

// Mock the API service
const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../services/api', () => ({
  apiService: mockApiService,
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('useApi hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    mockApiService.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useApi('/test'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.retry).toBe('function');
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockApiService.get.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockApiService.get).toHaveBeenCalledWith('/test');
  });

  it('should handle API errors', async () => {
    const mockError = new ApiError(404, 'Not found');
    mockApiService.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle non-ApiError errors', async () => {
    const mockError = new Error('Generic error');
    mockApiService.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Unknown error occurred');
  });

  it('should refetch when dependencies change', async () => {
    const mockData1 = { id: 1, name: 'Test1' };
    const mockData2 = { id: 2, name: 'Test2' };
    
    mockApiService.get
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result, rerender } = renderHook(
      ({ endpoint, deps }) => useApi(endpoint, deps),
      {
        initialProps: { endpoint: '/test', deps: [1] }
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);
    expect(mockApiService.get).toHaveBeenCalledTimes(1);

    // Change dependencies
    rerender({ endpoint: '/test', deps: [2] });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData2);
    expect(mockApiService.get).toHaveBeenCalledTimes(2);
  });

  it('should not update state after unmount', async () => {
    const mockData = { id: 1, name: 'Test' };
    let resolveFn: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolveFn = resolve;
    });
    
    mockApiService.get.mockReturnValue(mockPromise);

    const { result, unmount } = renderHook(() => useApi('/test'));

    expect(result.current.loading).toBe(true);

    // Unmount before promise resolves
    unmount();

    // Resolve the promise
    resolveFn!(mockData);

    // Wait a bit to ensure no state update occurs
    await new Promise(resolve => setTimeout(resolve, 10));

    // The hook should still be in loading state since it was unmounted
    expect(result.current.loading).toBe(true);
  });

  it('should retry failed requests', async () => {
    const mockError = new ApiError(500, 'Server error');
    const mockData = { id: 1, name: 'Test' };
    
    mockApiService.get
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useApi('/test'));

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();

    // Retry the request
    result.current.retry();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockApiService.get).toHaveBeenCalledTimes(2);
  });
});

describe('useApiMutation hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useApiMutation());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should handle POST mutations successfully', async () => {
    const mockData = { id: 1, name: 'Created' };
    const requestData = { name: 'Test' };
    mockApiService.post.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiMutation());

    const mutatePromise = result.current.mutate('/test', requestData, 'POST');

    expect(result.current.loading).toBe(true);

    const resolvedData = await mutatePromise;

    expect(resolvedData).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiService.post).toHaveBeenCalledWith('/test', requestData);
  });

  it('should handle PUT mutations successfully', async () => {
    const mockData = { id: 1, name: 'Updated' };
    const requestData = { name: 'Test Updated' };
    mockApiService.put.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiMutation());

    const resolvedData = await result.current.mutate('/test/1', requestData, 'PUT');

    expect(resolvedData).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(mockApiService.put).toHaveBeenCalledWith('/test/1', requestData);
  });

  it('should handle DELETE mutations successfully', async () => {
    const mockData = { success: true };
    mockApiService.delete.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiMutation());

    const resolvedData = await result.current.mutate('/test/1', undefined, 'DELETE');

    expect(resolvedData).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(mockApiService.delete).toHaveBeenCalledWith('/test/1');
  });

  it('should default to POST method', async () => {
    const mockData = { id: 1, name: 'Created' };
    const requestData = { name: 'Test' };
    mockApiService.post.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiMutation());

    await result.current.mutate('/test', requestData);

    expect(mockApiService.post).toHaveBeenCalledWith('/test', requestData);
  });

  it('should handle mutation errors', async () => {
    const mockError = new ApiError(400, 'Bad request');
    mockApiService.post.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiMutation());

    await expect(result.current.mutate('/test', {})).rejects.toEqual(mockError);

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle non-ApiError mutations', async () => {
    const mockError = new Error('Generic error');
    mockApiService.post.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiMutation());

    await expect(result.current.mutate('/test', {})).rejects.toBeInstanceOf(ApiError);

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Unknown error occurred');
  });

  it('should reset state correctly', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockApiService.post.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiMutation());

    // Perform mutation
    await result.current.mutate('/test', {});

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();

    // Reset state
    result.current.reset();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple concurrent mutations correctly', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };
    
    mockApiService.post
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useApiMutation());

    // Start both mutations
    const promise1 = result.current.mutate('/test1', {});
    const promise2 = result.current.mutate('/test2', {});

    expect(result.current.loading).toBe(true);

    // Wait for both to complete
    const [resolved1, resolved2] = await Promise.all([promise1, promise2]);

    expect(resolved1).toEqual(mockData1);
    expect(resolved2).toEqual(mockData2);
    expect(result.current.loading).toBe(false);
    // The last resolved mutation should be in the state
    expect(result.current.data).toEqual(mockData2);
  });
});