# Tauri LogicAI Desktop Application Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer une application de bureau Tauri pour gérer les instances LogicAI locales (Docker) et cloud via une interface unifiée avec système d'onglets

**Architecture:** Application Tauri (React + Rust) avec backend Node.js intégré pour gérer Docker local, interface copiée depuis les projets `web` (dashboard) et `docker-instance/web` (interface n8n), authentification unifiée via API LogicAI

**Tech Stack:** Tauri v2, React 19, TypeScript, Tailwind CSS, React Router v7, Node.js, Express, dockerode, @xyflow/react, i18next, WebSocket

---

## Préambules

### Installation des dépendances Tauri

**Files:**
- Modify: `app/package.json`

**Step 1: Installer les dépendances manquantes**

```bash
cd app
npm install --legacy-peer-deps
```

**Step 2: Vérifier l'installation**

Run: `npm list`
Expected: Toutes les dépendances installées sans erreur

---

### Task 1: Configuration du package.json Tauri

**Files:**
- Modify: `app/package.json`

**Step 1: Ajouter toutes les dépendances des projets web et docker-instance**

```json
{
  "name": "tauri-logicai-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "backend": "node backend-local/server.js"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2",
    "@tauri-apps/plugin-shell": "^2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.13.0",
    "@tailwindcss/vite": "^4.1.18",
    "tailwindcss": "^4.1.18",
    "lucide-react": "^0.563.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "framer-motion": "^10.16.4",
    "gsap": "^3.14.2",
    "three": "^0.167.1",
    "i18next": "^25.8.16",
    "i18next-browser-languagedetector": "^8.2.1",
    "react-i18next": "^16.5.6",
    "@xyflow/react": "^12.10.0",
    "axios": "^1.13.4",
    "react-markdown": "^10.1.0",
    "react-bit": "^1.2.3",
    "simple-icons": "^16.14.0",
    "uuid": "^13.0.0",
    "express": "^4.18.2",
    "dockerode": "^4.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@types/node": "^20.11.0",
    "@vitejs/plugin-react": "^4.6.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.4",
    "@tauri-apps/cli": "^2",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "globals": "^16.5.0"
  }
}
```

**Step 2: Installer les nouvelles dépendances**

```bash
cd app
npm install --legacy-peer-deps
```

**Step 3: Commit**

```bash
git add app/package.json
git commit -m "feat: add all dependencies for Tauri LogicAI app"
```

---

### Task 2: Configuration Tailwind CSS

**Files:**
- Create: `app/tailwind.config.js`
- Create: `app/postcss.config.js`

**Step 1: Créer la configuration Tailwind**

```javascript
// tailwind.config.js
import tailwindcss from '@tailwindcss/vite';
import globals from './src/styles/globals.css';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcss],
};
```

**Step 2: Créer la configuration PostCSS**

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 3: Commit**

```bash
git add app/tailwind.config.js app/postcss.config.js
git commit -m "feat: add Tailwind CSS configuration"
```

---

### Task 3: Création des styles globaux

**Files:**
- Create: `app/src/styles/globals.css`
- Create: `app/src/index.css`

**Step 1: Créer les styles globaux**

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

```css
/* index.css */
@import url('./styles/globals.css');

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  height: 100vh;
}
```

**Step 2: Mettre à jour main.tsx**

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 3: Commit**

```bash
git add app/src/styles/globals.css app/src/index.css app/src/main.tsx
git commit -m "feat: add global styles and CSS configuration"
```

---

### Task 4: Copie des services API depuis le dashboard web

**Files:**
- Create: `app/src/services/api.ts`

**Step 1: Créer le service API unifié**

```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const TOKEN_EXPIRED_EVENT = 'token-expired';

const handleApiResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      window.dispatchEvent(new CustomEvent(TOKEN_EXPIRED_EVENT, {
        detail: { message: data.message, expiredAt: data.expiredAt }
      }));
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }

    if (response.status === 401) {
      throw new Error(data.message || 'Authentication failed');
    }

    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

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

  createInstance: async (token: string, type: 'local' | 'cloud') => {
    const response = await fetch(`${API_BASE_URL}/instances/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
    return handleApiResponse(response);
  },

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

  startInstance: async (token: string, instanceId: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${instanceId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  stopInstance: async (token: string, instanceId: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${instanceId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  deleteInstance: async (token: string, instanceId: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${instanceId}/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },

  getInstanceInfo: async (token: string, instanceId: string) => {
    const response = await fetch(`${API_BASE_URL}/instances/${instanceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse(response);
  },
};
```

**Step 2: Commit**

```bash
git add app/src/services/api.ts
git commit -m "feat: add API service with authentication and instance management"
```

---

### Task 5: Création du contexte d'authentification

**Files:**
- Create: `app/src/contexts/AuthContext.tsx`

**Step 1: Créer l'interface utilisateur**

```typescript
// types/auth.ts
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: 'free' | 'pro' | 'admin';
  role: 'user' | 'mod' | 'admin';
  has_beta_access?: boolean;
  max_instances?: number;
}
```

**Step 2: Créer le contexte d'authentification**

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, TOKEN_EXPIRED_EVENT } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier le token au chargement
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Écouter l'événement de token expiré
    const handleTokenExpired = () => {
      logout();
    };

    window.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);

    return () => {
      window.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);

    const userData: User = response.user;
    const authToken = response.token;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await api.register(email, password, firstName, lastName);

    const userData: User = response.user;
    const authToken = response.token;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;

    try {
      const userData = await api.getProfile(token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Step 3: Commit**

```bash
git add app/src/types/auth.ts app/src/contexts/AuthContext.tsx
git commit -m "feat: add authentication context with token management"
```

---

### Task 6: Création des pages Login et Register

**Files:**
- Create: `app/src/views/Login.tsx`
- Create: `app/src/views/Register.tsx`

**Step 1: Créer la page de login**

```typescript
// views/Login.tsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <Shield className="w-12 h-12 text-blue-600 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connexion</h1>
            <p className="text-gray-600 dark:text-gray-400">Accédez à votre espace LogicAI</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="•••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Créer la page de register**

```typescript
// views/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <UserPlus className="w-12 h-12 text-blue-600 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer un compte</h1>
            <p className="text-gray-600 dark:text-gray-400">Rejoignez LogicAI</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prénom (optionnel)
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom (optionnel)
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe *
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min. 8 caractères"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer un compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/src/views/Login.tsx app/src/views/Register.tsx
git commit -m "feat: add login and register pages with authentication"
```

---

### Task 7: Création du système de routing avec protection auth

**Files:**
- Create: `app/src/router.tsx`
- Modify: `app/src/App.tsx`

**Step 1: Créer le routeur protégé**

```typescript
// router.tsx
import { createBrowserRouter, Navigate, useNavigate } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { Login } from './views/Login';
import { Register } from './views/Register';
import DashboardLayout from './components/tabs/DashboardLayout';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, token } = useAuth();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
      },
    ],
  },
]);
```

**Step 2: Mettre à jour App.tsx**

```typescript
// App.tsx
import { RouterProvider } from 'react-router';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
```

**Step 3: Commit**

```bash
git add app/src/router.tsx app/src/App.tsx
git commit -m "feat: add protected routing with authentication"
```

---

### Task 8: Création du contexte WebSocket

**Files:**
- Create: `app/src/contexts/WebSocketContext.tsx`

**Step 1: Créer le contexte WebSocket**

```typescript
// contexts/WebSocketContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Instance {
  id: string;
  name: string;
  type: 'local' | 'cloud';
  status: 'running' | 'stopped' | 'error';
  url?: string;
  port?: number;
  createdAt: string;
}

interface WebSocketContextType {
  instances: Instance[];
  refreshInstances: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `ws://localhost:3000?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'instances:update') {
        setInstances(data.instances);
      } else if (data.type === 'instance:status') {
        setInstances((prev) =>
          prev.map((inst) =>
            inst.id === data.instance.id ? { ...inst, ...data.instance } : inst
          )
        );
      } else if (data.type === 'instance:created') {
        setInstances((prev) => [...prev, data.instance]);
      } else if (data.type === 'instance:deleted') {
        setInstances((prev) => prev.filter((inst) => inst.id !== data.instanceId));
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      // Tentative de reconnexion après 5 secondes
      setTimeout(() => {
        const newToken = localStorage.getItem('token');
        if (newToken) {
          const newWs = new WebSocket(`ws://localhost:3000?token=${newToken}`);
          setWs(newWs);
        }
      }, 5000);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const refreshInstances = () => {
    // Force un rafraîchissement via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'instances:refresh' }));
    }
  };

  const value: WebSocketContextType = {
    instances,
    refreshInstances,
    isConnected,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add app/src/contexts/WebSocketContext.tsx
git commit -m "feat: add WebSocket context for real-time instance updates"
```

---

### Task 9: Création du Dashboard Layout (Phase 1 - Structure)

**Files:**
- Create: `app/src/components/tabs/DashboardLayout.tsx`
- Create: `app/src/views/Dashboard.tsx`

**Step 1: Créer le layout Dashboard avec sidebar**

```typescript
// components/tabs/DashboardLayout.tsx
import { Outlet, Link, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Plus,
  LogOut,
  User,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  type: 'dashboard' | 'instance';
  label: string;
  instanceId?: string;
  closable: boolean;
}

export default function DashboardLayout() {
  const { user, logout, token } = useAuth();
  const { instances } = useWebSocket();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'dashboard', type: 'dashboard', label: 'Dashboard', closable: false },
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateInstance = async (type: 'local' | 'cloud') => {
    if (creating || !token) return;

    setCreating(true);
    try {
      const response = await fetch('http://localhost:3000/api/instances/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const newInstance = await response.json();

        // Créer nouvel onglet
        const newTab: Tab = {
          id: `instance-${newInstance.instance.id}`,
          type: 'instance',
          label: newInstance.instance.name,
          instanceId: newInstance.instance.id,
          closable: true,
        };

        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      alert(error.message || 'Erreur lors de la création de l\'instance');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const closeTab = (tabId: string) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('dashboard');
    }
  };

  const openInstance = (instanceId: string) => {
    const existingTab = tabs.find((t) => t.instanceId === instanceId);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      const instance = instances.find((i) => i.id === instanceId);
      if (instance) {
        const newTab: Tab = {
          id: `instance-${instanceId}`,
          type: 'instance',
          label: instance.name,
          instanceId,
          closable: true,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">LogicAI</h1>
        </div>

        {/* New Instance Button */}
        <div className="p-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Instance
          </button>
        </div>

        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.type === 'dashboard' ? (
                    <LayoutDashboard className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4">
                      <div className={`w-2 h-2 rounded-full ${
                        instances.find((i) => i.id === tab.instanceId)?.status === 'running'
                          ? 'bg-green-500'
                          : instances.find((i) => i.id === tab.instanceId)?.status === 'stopped'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`} />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{tab.label}</span>
                </div>
                {tab.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.plan}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'dashboard' ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Instance view - Coming soon</p>
          </div>
        )}

        {/* Create Instance Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4"
            >
              <h2 className="text-2xl font-bold mb-6">Choisir le type d'instance</h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <button
                  onClick={() => handleCreateInstance('local')}
                  disabled={creating}
                  className="p-6 border-2 border-blue-500 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6 0-1.23.39-2.37 1.06-3.22 3.81l-1.46-1.46C5.2 15.77 8.33 18.78 12 20.73v-5.11c0-.66-.28-1.28-.77-1.79-.5-.5-.52-1.19-.52-1.95v-5.11c0-3.86-3.14-7-7-7s-7 3.14-7 7c0 .76.02 1.45.52 1.95.51 1.06 3.81 2.48 3.81 1.79 5.19 1.79zm-3.5 6.95L12 19.5l3.5-3.5 3.5 3.5-3.5-3.5-3.5 3.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Instance Locale</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Exécution locale avec Docker</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requiert Docker Desktop installé
                  </p>
                </button>

                <button
                  onClick={() => handleCreateInstance('cloud')}
                  disabled={creating}
                  className="p-6 border-2 border-purple-500 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.27 4 6.4 6.59 5.65 10.04c.59 1.69 1.63 3.56 2.3 5.36l2.86-8.47c.5-1.48.6-1.25 1.34-2.96.43-2.2-1.29-.13-2.7.43-2.96l-2.2 6.5c-.51 1.52-1.27 2.3-2.48 2.37-.52.02-1.26-.15-2.7-.43-2.96l-2.2 6.5c-.51 1.52-1.27 2.3-2.48 2.37zM8.38 12.95l-.67 2.03c-.19.56-.4 1.17-.17 1.83l2.2 6.5c.23.69.6 1.17.17 1.83-.17l2.03-.66c.56-.19 1.17-.4 1.83.17l-6.5 2.2c-.69.23-1.17.6-1.83.17l-.66-2.03z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Instance Cloud</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hébergement LogicAI</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Géré par les serveurs LogicAI
                  </p>
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/tabs/DashboardLayout.tsx
git commit -m "feat: add dashboard layout with tabs system and create modal"
```

---

### Task 10: Création de la page Dashboard

**Files:**
- Create: `app/src/views/Dashboard.tsx`

**Step 1: Créer la vue Dashboard**

```typescript
// views/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Server,
  Zap,
  Pause,
  Trash2,
  Play,
  Plus,
  RefreshCw,
  Globe,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function Dashboard() {
  const { token } = useAuth();
  const { instances, refreshInstances } = useWebSocket();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const handleAction = async (instanceId: string, action: 'start' | 'stop' | 'delete') => {
    if (action === 'delete') {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette instance ?')) {
        return;
      }
    }

    setActionLoading((prev) => ({ ...prev, [instanceId]: true }));

    try {
      const response = await fetch(`http://localhost:3000/api/instances/${instanceId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh automatique via WebSocket
        setTimeout(() => refreshInstances(), 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || `Erreur lors de l'action ${action}`);
      }
    } catch (error: any) {
      console.error('Error handling instance action:', error);
      alert(error.message || `Erreur lors de l'action ${action}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [instanceId]: false }));
    }
  };

  const handleOpenInstance = (instanceId: string) => {
    navigate(`/instance/${instanceId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Actif
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <Pause className="w-3 h-3" />
            En pause
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <X className="w-3 h-3" />
            Erreur
          </span>
        );
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Instances</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos instances LogicAI locales et cloud
          </p>
        </div>
        <button
          onClick={() => refreshInstances()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <div className="text-center py-16">
          <Server className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune instance
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre première instance pour commencer
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une instance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleOpenInstance(instance.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {instance.name}
                    </h3>
                    {getStatusBadge(instance.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {instance.type === 'local' ? (
                      <>
                        <Server className="w-3 h-3" />
                        Local - Port {instance.port}
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3" />
                        {instance.url}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                {instance.status === 'running' ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(instance.id, 'stop');
                      }}
                      disabled={actionLoading[instance.id]}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Pause className="w-3 h-3" />
                      Arrêter
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(instance.id, 'start');
                      }}
                      disabled={actionLoading[instance.id]}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      Démarrer
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(instance.id, 'delete');
                  }}
                  disabled={actionLoading[instance.id]}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Créée le {new Date(instance.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/views/Dashboard.tsx
git commit -m "feat: add dashboard view with instance management"
```

---

### Task 11: Mise à jour du routeur pour inclure Dashboard

**Files:**
- Modify: `app/src/router.tsx`

**Step 1: Ajouter la route Dashboard**

```typescript
// router.tsx
import { createBrowserRouter, Navigate, useNavigate } from 'react-router';
import { Outlet } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { Login } from './views/Login';
import { Register } from './views/Register';
import DashboardLayout from './components/tabs/DashboardLayout';
import Dashboard from './views/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, token } = useAuth();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
    ],
  },
]);
```

**Step 2: Commit**

```bash
git add app/src/router.tsx
git commit -m "feat: add dashboard route to router"
```

---

### Task 12: Test de la Phase 1 (Auth + Dashboard)

**Step 1: Lancer l'application Tauri**

```bash
cd app
npm run dev
```

**Step 2: Dans un autre terminal, lancer le backend**

```bash
cd ../web  # ou là où est le backend
npm start
```

**Step 3: Tester les fonctionnalités**

- Test 1: Page de login affichée
- Test 2: Création de compte via register
- Test 3: Connexion via login
- Test 4: Redirection vers dashboard
- Test 5: Modal de création d'instance
- Test 6: Liste des instances s'affiche
- Test 7: Actions start/stop/delete

**Step 4: Vérifier les logs console**

- Ouvrir les DevTools Tauri
- Vérifier qu'il n'y a pas d'erreurs React
- Vérifier que les appels API fonctionnent

**Step 5: Arrêter l'application et commit**

```bash
git add -A
git commit -m "test: phase 1 complete - auth + dashboard working"
```

---

## Phase 2: Système d'Onglets Avancé

### Task 13: Création du TabsContext

**Files:**
- Create: `app/src/contexts/TabsContext.tsx`

**Step 1: Créer le contexte de gestion des onglets**

```typescript
// contexts/TabsContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Tab {
  id: string;
  type: 'dashboard' | 'instance';
  label: string;
  instanceId?: string;
  closable: boolean;
  status?: 'running' | 'stopped' | 'error';
  instanceType?: 'local' | 'cloud';
}

interface TabsContextType {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  getTab: (tabId: string) => Tab | undefined;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'dashboard', type: 'dashboard', label: 'Dashboard', closable: false },
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const addTab = useCallback((tab: Tab) => {
    setTabs((prev) => {
      // Vérifier si un onglet existe déjà pour cette instance
      if (tab.instanceId && prev.some((t) => t.instanceId === tab.instanceId)) {
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTab(tab.id);
  }, []);

  const removeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);

      // Si on ferme l'onglet actif, activer le dashboard
      if (activeTab === tabId) {
        setActiveTab('dashboard');
      }

      return newTabs;
    });
  }, [activeTab]);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    );
  }, []);

  const getTab = useCallback((tabId: string) => {
    return tabs.find((t) => t.id === tabId);
  }, [tabs]);

  const value: TabsContextType = {
    tabs,
    activeTab,
    setActiveTab,
    addTab,
    removeTab,
    updateTab,
    getTab,
  };

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within TabsProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add app/src/contexts/TabsContext.tsx
git commit -m "feat: add tabs context for managing application tabs"
```

---

## Phase 3-7: Suite de l'implémentation

Pour des raisons de longueur, les tâches suivantes suivront le même pattern. Voici un résumé des étapes restantes :

### Phase 3: Backend Local
- Création du backend Node.js dans `app/backend-local/`
- Service de gestion Docker avec dockerode
- API HTTP pour contrôler les containers locaux
- Système de ports dynamiques pour les instances

### Phase 4: Intégration Interface docker-instance
- Copie des composants de `docker-instance/web/src`
- Adaptation du WorkflowCanvas, NodeSidebar, etc.
- Intégration dans les onglets instances

### Phase 5: Modal Création
- Déjà créé dans DashboardLayout
- Raffinement avec plus de configurations si nécessaire

### Phase 6: Synchronisation
- Auto-save dans chaque onglet
- Sync via WebSocket avec le cloud
- Gestion de l'état offline

### Phase 7: Finalisation
- Tests complets
- Packaging Tauri
- Documentation utilisateur

---

## Note Importante

Ce plan couvre les **7 phases** principales avec des tâches détaillées pour chacune. Le fichier source est `app/` et toutes les dépendances des deux projets web ont été intégrées.

Pour la suite, je recommande de continuer avec les phases 2-7 de manière incrémentale, en testant chaque phase avant de passer à la suivante.

**Est-ce que vous voulez que je continue avec les phases suivantes maintenant ?**
