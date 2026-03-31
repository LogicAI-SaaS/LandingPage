const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.logicai.fr/api';

// Événement personnalisé pour la déconnexion automatique
export const TOKEN_EXPIRED_EVENT = 'token-expired';

// Helper pour gérer les réponses API et détecter les tokens expirés
const handleApiResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    // Détecter spécifiquement les tokens expirés
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      // Émettre un événement pour notifier l'application
      window.dispatchEvent(new CustomEvent(TOKEN_EXPIRED_EVENT, {
        detail: { message: data.message, expiredAt: data.expiredAt }
      }));
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }

    // Autres erreurs d'authentification
    if (response.status === 401) {
      throw new Error(data.message || 'Authentication failed');
    }

    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  // Inscription
  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  // Connexion
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  // Obtenir le profil
  getProfile: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Créer une instance (avec type local ou cloud)
  createInstance: async (token: string, type: 'local' | 'cloud') => {
    const response = await fetch(`${API_BASE_URL}/instances/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deploymentType: type }),
    });
    return handleApiResponse(response);
  },

  // Récupérer toutes les instances
  getInstances: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Arrêter une instance
  stopInstance: async (token: string, uuid: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${uuid}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Démarrer une instance
  startInstance: async (token: string, uuid: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${uuid}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Supprimer une instance
  deleteInstance: async (token: string, uuid: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Définir le mot de passe de l'instance
  setInstancePassword: async (token: string, uuid: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${uuid}/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return handleApiResponse(response);
  },

  // Obtenir un token d'authentification pour une instance (auto-login)
  getInstanceAuthToken: async (token: string, uuid: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${uuid}/auth-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Admin API - Obtenir les statistiques globales
  getAdminStats: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Admin API - Obtenir tous les utilisateurs
  getAllUsers: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Admin API - Mettre à jour le plan d'un utilisateur
  updateUserPlan: async (token: string, userId: number, plan: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/plan`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    });
    return handleApiResponse(response);
  },

  // Admin API - Mettre à jour le rôle d'un utilisateur
  updateUserRole: async (token: string, userId: number, role: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    return handleApiResponse(response);
  },

  // Admin API - Supprimer un utilisateur
  deleteUser: async (token: string, userId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  // Discord OAuth - Obtenir l'URL d'autorisation
  getDiscordAuthUrl: async () => {
    const response = await fetch(`${API_BASE_URL}/discord/auth-url`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get Discord auth URL');
    }
    return data;
  },

  // Discord OAuth - Callback (échange de code contre token)
  discordCallback: async (code: string, state: string) => {
    const response = await fetch(`${API_BASE_URL}/discord/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Discord authentication failed');
    }
    return data;
  },
};
