const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Service API pour communiquer avec le backend LogicAI
 * Toutes les requêtes sont automatiquement authentifiées si un token est fourni
 */
class ApiService {
  /**
   * Effectue une requête authentifiée
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== AUTH ====================

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/profile', {}, token);
  }

  // ==================== INSTANCES ====================

  async getInstances(token: string): Promise<ApiResponse<{ instances: any[] }>> {
    return this.request('/instances/list', {}, token);
  }

  async createInstance(
    token: string,
    type: 'cloud' | 'local'
  ): Promise<ApiResponse<{ instance: any }>> {
    // Sur mobile, on force le type 'cloud' pour les instances
    return this.request('/instances/create', {
      method: 'POST',
      body: JSON.stringify({ deploymentType: 'cloud' }),
    }, token);
  }

  async getInstanceDetails(
    token: string,
    uuid: string
  ): Promise<ApiResponse<{ instance: any }>> {
    return this.request(`/instances/${uuid}`, {}, token);
  }

  async startInstance(
    token: string,
    uuid: string
  ): Promise<ApiResponse> {
    return this.request(`/instances/${uuid}/start`, {
      method: 'POST',
    }, token);
  }

  async stopInstance(
    token: string,
    uuid: string
  ): Promise<ApiResponse> {
    return this.request(`/instances/${uuid}/stop`, {
      method: 'POST',
    }, token);
  }

  async deleteInstance(
    token: string,
    uuid: string
  ): Promise<ApiResponse> {
    return this.request(`/instances/${uuid}`, {
      method: 'DELETE',
    }, token);
  }

  // ==================== INSTANCE AUTH ====================

  async getInstanceAuthToken(
    token: string,
    uuid: string
  ): Promise<ApiResponse<{
    instanceToken: string;
    instanceUrl: string;
    instanceId: string;
    user: any;
  }>> {
    return this.request(`/instances/${uuid}/auth-token`, {
      method: 'POST',
    }, token);
  }
}

export const api = new ApiService();
