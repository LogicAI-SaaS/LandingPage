import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LogicAIConfig,
  Instance,
  TriggerWorkflowOptions,
  WebhookTriggerOptions,
  ApiResponse,
  CreateInstanceOptions,
  InstanceStats,
  User,
} from './types';
import {
  LogicAIError,
  AuthenticationError,
  TokenExpiredError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from './errors';

/**
 * Client SDK pour interagir avec l'API LogicAI
 * 
 * @example
 * ```typescript
 * const client = new LogicAIClient({
 *   apiUrl: 'https://api.logicai.com',
 *   token: 'your-jwt-token'
 * });
 * 
 * // Créer une instance
 * const instance = await client.instances.create({ name: 'My Instance' });
 * 
 * // Trigger un workflow
 * await client.workflows.trigger({
 *   instanceUuid: instance.uuid,
 *   workflowId: 'my-workflow',
 *   data: { user: 'John', action: 'signup' }
 * });
 * ```
 */
export class LogicAIClient {
  private http: AxiosInstance;
  private config: Required<LogicAIConfig>;

  constructor(config: LogicAIConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
    };

    this.http = axios.create({
      baseURL: `${this.config.apiUrl}/api`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
      },
    });

    // Intercepteur de réponse pour gérer les erreurs
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: AxiosError<ApiResponse>): Error {
    if (!error.response) {
      return new NetworkError('Network error: Unable to reach server', {
        message: error.message,
        code: error.code,
      });
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || error.message;

    // Token expiré
    if (status === 401 && data?.code === 'TOKEN_EXPIRED') {
      return new TokenExpiredError(message, data?.expiredAt);
    }

    // Erreurs d'authentification
    if (status === 401 || status === 403) {
      return new AuthenticationError(message, data);
    }

    // Ressource non trouvée
    if (status === 404) {
      return new NotFoundError(message);
    }

    // Validation
    if (status === 400 || status === 422) {
      return new ValidationError(message, data);
    }

    // Rate limiting
    if (status === 429) {
      return new RateLimitError(message);
    }

    // Erreur générique
    return new LogicAIError(message, data?.code, status, data);
  }

  /**
   * Mise à jour du token d'authentification
   */
  public setToken(token: string): void {
    this.config.token = token;
    this.http.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  public async getProfile(): Promise<User> {
    const response = await this.http.get<ApiResponse<{ user: User }>>('/auth/profile');
    if (!response.data.data?.user) {
      throw new LogicAIError('Invalid response format');
    }
    return response.data.data.user;
  }

  /**
   * Gestion des instances
   */
  public instances = {
    /**
     * Lister toutes les instances de l'utilisateur
     */
    list: async (): Promise<Instance[]> => {
      const response = await this.http.get<ApiResponse<{ instances: Instance[] }>>('/instances/list');
      return response.data.data?.instances || [];
    },

    /**
     * Créer une nouvelle instance
     */
    create: async (options?: CreateInstanceOptions): Promise<Instance> => {
      const response = await this.http.post<ApiResponse<{ instance: Instance }>>(
        '/instances/create',
        options || {}
      );
      if (!response.data.data?.instance) {
        throw new LogicAIError('Failed to create instance');
      }
      return response.data.data.instance;
    },

    /**
     * Obtenir une instance par UUID
     */
    get: async (uuid: string): Promise<Instance> => {
      const response = await this.http.get<ApiResponse<{ instance: Instance }>>(`/instances/${uuid}`);
      if (!response.data.data?.instance) {
        throw new NotFoundError('Instance');
      }
      return response.data.data.instance;
    },

    /**
     * Démarrer une instance
     */
    start: async (uuid: string): Promise<Instance> => {
      const response = await this.http.post<ApiResponse<{ instance: Instance }>>(`/instances/${uuid}/start`);
      if (!response.data.data?.instance) {
        throw new LogicAIError('Failed to start instance');
      }
      return response.data.data.instance;
    },

    /**
     * Arrêter une instance
     */
    stop: async (uuid: string): Promise<Instance> => {
      const response = await this.http.post<ApiResponse<{ instance: Instance }>>(`/instances/${uuid}/stop`);
      if (!response.data.data?.instance) {
        throw new LogicAIError('Failed to stop instance');
      }
      return response.data.data.instance;
    },

    /**
     * Supprimer une instance
     */
    delete: async (uuid: string): Promise<void> => {
      await this.http.delete(`/instances/${uuid}`);
    },

    /**
     * Obtenir les statistiques des instances
     */
    stats: async (): Promise<InstanceStats> => {
      const instances = await this.instances.list();
      const runningCount = instances.filter(i => i.status === 'running').length;
      const stoppedCount = instances.filter(i => i.status === 'stopped').length;

      return {
        instanceCount: instances.length,
        runningCount,
        stoppedCount,
        planLimits: {
          max_instances: -1, // À récupérer depuis le profil si disponible
          max_workflows: -1,
          max_executions_per_day: -1,
        },
      };
    },
  };

  /**
   * Gestion des workflows
   */
  public workflows = {
    /**
     * Trigger un workflow spécifique par son ID
     * 
     * @example
     * ```typescript
     * await client.workflows.trigger({
     *   instanceUuid: 'abc-123',
     *   workflowId: 'my-workflow',
     *   data: { name: 'John Doe', email: 'john@example.com' }
     * });
     * ```
     */
    trigger: async (options: TriggerWorkflowOptions): Promise<any> => {
      const instance = await this.instances.get(options.instanceUuid);
      
      if (!instance.url) {
        throw new LogicAIError('Instance URL not available. Make sure the instance is running.');
      }

      if (instance.status !== 'running') {
        throw new LogicAIError(`Instance is not running (status: ${instance.status})`);
      }

      // Créer un client axios spécifique pour l'instance LogicAI
      const n8nClient = axios.create({
        baseURL: instance.url,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      try {
        const response = await n8nClient.post(
          `/webhook/${options.workflowId}`,
          options.data || {}
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new LogicAIError(
            `Failed to trigger workflow: ${error.message}`,
            'WORKFLOW_TRIGGER_ERROR',
            error.response?.status
          );
        }
        throw error;
      }
    },

    /**
     * Trigger un webhook personnalisé
     * 
     * @example
     * ```typescript
     * await client.workflows.webhook({
     *   instanceUuid: 'abc-123',
     *   webhookPath: 'form-submission',
     *   data: { form: 'contact', name: 'John', message: 'Hello' }
     * });
     * ```
     */
    webhook: async (options: WebhookTriggerOptions): Promise<any> => {
      const instance = await this.instances.get(options.instanceUuid);
      
      if (!instance.url) {
        throw new LogicAIError('Instance URL not available. Make sure the instance is running.');
      }

      if (instance.status !== 'running') {
        throw new LogicAIError(`Instance is not running (status: ${instance.status})`);
      }

      const method = options.method || 'POST';
      const n8nClient = axios.create({
        baseURL: instance.url,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      try {
        const response = await n8nClient.request({
          method,
          url: `/webhook/${options.webhookPath}`,
          data: method !== 'GET' ? options.data : undefined,
          params: method === 'GET' ? options.data : undefined,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new LogicAIError(
            `Failed to trigger webhook: ${error.message}`,
            'WEBHOOK_TRIGGER_ERROR',
            error.response?.status
          );
        }
        throw error;
      }
    },
  };
}
