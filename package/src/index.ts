/**
 * LogicAI SDK - Client JavaScript/TypeScript pour l'API LogicAI
 * 
 * @packageDocumentation
 */

export { LogicAIClient } from './LogicAIClient';

// Export des types
export type {
  LogicAIConfig,
  User,
  Instance,
  Workflow,
  WorkflowNode,
  WorkflowExecution,
  TriggerWorkflowOptions,
  WebhookTriggerOptions,
  ApiResponse,
  CreateInstanceOptions,
  InstanceStats,
} from './types';

// Export des erreurs
export {
  LogicAIError,
  AuthenticationError,
  TokenExpiredError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from './errors';

// Export par défaut
export { LogicAIClient as default } from './LogicAIClient';
