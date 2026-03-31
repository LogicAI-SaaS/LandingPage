/**
 * Service pour gérer les instances locales Docker
 * Ce service communique avec le backend local Node.js qui gère Docker
 */

const LOCAL_API_URL = 'http://localhost:3001/api';

export interface LocalInstance {
  id: string;
  name: string;
  uuid: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
  port: number;
  container_id?: string;
  deployment_type: 'local';
}

/**
 * Récupère toutes les instances locales Docker
 */
export async function getLocalInstances(): Promise<LocalInstance[]> {
  try {
    const response = await fetch(`${LOCAL_API_URL}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si le backend local n'est pas disponible, retourner un tableau vide
      if (response.status === 404 || response.status === 503) {
        console.warn('[LocalInstances] Backend local non disponible');
        return [];
      }
      throw new Error('Erreur lors de la récupération des instances locales');
    }

    const data = await response.json();
    return data.instances || [];
  } catch (error) {
    console.error('[LocalInstances] Erreur:', error);
    // En cas d'erreur (backend local non démarré), retourner un tableau vide
    return [];
  }
}

/**
 * Crée une nouvelle instance locale
 */
export async function createLocalInstance(name?: string): Promise<LocalInstance> {
  const response = await fetch(`${LOCAL_API_URL}/instances/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la création de l\'instance locale');
  }

  return response.json();
}

/**
 * Démarre une instance locale
 */
export async function startLocalInstance(uuid: string): Promise<void> {
  const response = await fetch(`${LOCAL_API_URL}/instances/${uuid}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors du démarrage de l\'instance locale');
  }
}

/**
 * Arrête une instance locale
 */
export async function stopLocalInstance(uuid: string): Promise<void> {
  const response = await fetch(`${LOCAL_API_URL}/instances/${uuid}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de l\'arrêt de l\'instance locale');
  }
}

/**
 * Supprime une instance locale
 */
export async function deleteLocalInstance(uuid: string): Promise<void> {
  const response = await fetch(`${LOCAL_API_URL}/instances/${uuid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression de l\'instance locale');
  }
}

/**
 * Vérifie si le backend local est disponible
 */
export async function isLocalBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch {
    return false;
  }
}
