import { useState, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Hook para fazer requisições à API
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (method, url, data = null) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await api.get(url);
          break;
        case 'POST':
          response = await api.post(url, data);
          break;
        case 'PUT':
          response = await api.put(url, data);
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
        default:
          throw new Error(`Método HTTP ${method} não suportado`);
      }

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro na requisição';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Métodos de conveniência
  const get = useCallback((url) => makeRequest('GET', url), [makeRequest]);
  const post = useCallback((url, data) => makeRequest('POST', url, data), [makeRequest]);
  const put = useCallback((url, data) => makeRequest('PUT', url, data), [makeRequest]);
  const del = useCallback((url) => makeRequest('DELETE', url), [makeRequest]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null)
  };
}

/**
 * Hook para buscar dados de uma API com loading e error states
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get } = useApi();

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await get(url);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, get]);

  // Buscar dados quando URL mudar
  useState(() => {
    fetchData();
  }, [fetchData]);

  // Permitir refetch manual
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}
