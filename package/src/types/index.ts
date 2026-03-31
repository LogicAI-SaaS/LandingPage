/**
 * Types pour le SDK LogicAI
 */

export interface LogicAIConfig {
  /** Base URL de l'API LogicAI */
  apiUrl: string;
  /** Token d'authentification JWT */
  token: string;
  /** Timeout des requêtes en millisecondes (défaut: 30000) */
  timeout?: number;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  role: string;
  has_beta_access?: boolean;
  beta_access_id?: number;
  createdAt?: string;
}

export interface Instance {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  status: 'pending' | 'running' | 'stopped' | 'error';
  container_id?: string;
  port?: number;
  url?: string;
  password_set: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: 'manual' | 'webhook' | 'trigger';
  startedAt: string;
  stoppedAt?: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data?: Record<string, any>;
}

export interface TriggerWorkflowOptions {
  /** UUID de l'instance */
  instanceUuid: string;
  /** ID ou nom du workflow */
  workflowId: string;
  /** Données à envoyer au workflow */
  data?: Record<string, any>;
  /** Headers personnalisés */
  headers?: Record<string, string>;
}

export interface WebhookTriggerOptions {
  /** UUID de l'instance */
  instanceUuid: string;
  /** Chemin du webhook (ex: "form-submission") */
  webhookPath: string;
  /** Données à envoyer */
  data: Record<string, any>;
  /** Méthode HTTP (défaut: POST) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Headers personnalisés */
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  expiredAt?: Date;
}

export interface CreateInstanceOptions {
  /** Nom de l'instance (optionnel) */
  name?: string;
}

export interface InstanceStats {
  instanceCount: number;
  runningCount: number;
  stoppedCount: number;
  planLimits: {
    max_instances: number;
    max_workflows: number;
    max_executions_per_day: number;
  };
}
