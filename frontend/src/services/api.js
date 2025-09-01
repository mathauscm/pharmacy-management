/**
 * Serviço de API para comunicação com o backend
 */

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Classe para gerenciar requisições à API
 */
class ApiService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fazer requisição HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('authToken');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Verificar se a resposta é bem-sucedida
      if (!response.ok) {
        // Se não autorizado, limpar dados de autenticação e redirecionar
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        const errorData = await response.json().catch(() => ({ 
          message: `Erro HTTP: ${response.status} ${response.statusText}` 
        }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      // Tentar fazer parse do JSON
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  /**
   * Requisição GET
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }

  /**
   * Requisição POST
   */
  async post(endpoint, data = null) {
    const options = {
      method: 'POST'
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
        // Não definir Content-Type para FormData (deixar o browser definir)
        options.headers = {};
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return this.request(endpoint, options);
  }

  /**
   * Requisição PUT
   */
  async put(endpoint, data = null) {
    const options = {
      method: 'PUT'
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
        options.headers = {};
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return this.request(endpoint, options);
  }

  /**
   * Requisição DELETE
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Upload de arquivos
   */
  async uploadFiles(endpoint, files) {
    const formData = new FormData();
    
    // Adicionar arquivos ao FormData
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('xmlFiles', file);
      });
    } else {
      formData.append('xmlFile', files);
    }

    return this.post(endpoint, formData);
  }

  /**
   * Verificar saúde da API
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instancia padrão do serviço
const api = new ApiService();

// Funções de conveniência para manter compatibilidade
export async function fetchApi(url) {
  return api.get(url);
}

export { api, ApiService };
