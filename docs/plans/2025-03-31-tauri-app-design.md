# Application Tauri LogicAI - Design Document

**Date**: 2025-03-31
**Projet**: Application de bureau Tauri pour LogicAI
**Version**: 1.0

## Vue d'ensemble

L'application Tauri LogicAI est une application desktop hybride qui permet de gérer des instances LogicAI locales (via Docker) et cloud via une interface unifiée avec système d'onglets style Figma.

## Architecture Générale

### Composants Principaux

- **Frontend Tauri (React)** : Page d'authentification + Dashboard de gestion des instances
- **Service Backend Node.js intégré** : Gère les containers Docker locaux et communique avec l'API cloud
- **Interface unifiée** : Chaque instance (locale ou cloud) s'ouvre dans un onglet React simulé

### Intégration de Code

- **Dashboard web** : Copie des composants React, contexts (Auth, WebSocket, Toast), routing et services API depuis `web/`
- **docker-instance/web** : Copie de l'interface n8n complète depuis `docker-instance/web/`
- **Dépendances** : Installation de TOUTES les dépendances des deux projets dans package.json Tauri
- **Partage d'état** : AuthContext et WebSocketContext partagés entre dashboard et onglets

### Authentification

- **Système unifié** avec dashboard web via API LogicAI (`http://localhost:3000/api`)
- **JWT stockés** en localStorage
- **Pages publiques** : Login/Register uniquement
- **Pages privées** : Dashboard + onglets instances

## Structure des Onglets

### Système d'Onglets

- **Barre d'onglets** : Sidebar à gauche avec liste des onglets ouverts, bouton "+" pour en ajouter
- **Onglet Dashboard** : Toujours présent, liste toutes les instances avec actions (start/stop/delete)
- **Onglets d'instances** : Chaque instance ouverte crée un nouvel onglet affichant l'interface LogicAI
- **Badge d'état** : Indicateur visuel (actif/arrêté/erreur) pour chaque onglet instance
- **Drag & drop** : Réorganisation des onglets par glisser-déposer
- **Badge visuel** : "LOCAL" pour instances locales, URL pour instances cloud

### Navigation

- Changement d'état React instantané (pas de rechargement)
- Clic entre onglets fluide avec animations style Figma
- Fermeture d'onglet disponible avec confirmation si instance en cours d'exécution

## Gestion du Backend Local

### Service Node.js Intégré

- **Installation automatique** : Détecte Docker Desktop au premier lancement, guide installation si nécessaire
- **Port dynamique** : Backend démarre sur port aléatoire (5678-5680) pour éviter conflits
- **Communication** : Tauri communique via HTTP (localhost) avec le backend
- **Gestion Docker** : Utilise API Docker Engine pour créer/démarrer/arrêter containers
- **Isolation** : Chaque instance locale a son propre volume Docker et port unique
- **Logs** : Accessibles via interface Tauri pour chaque instance

### Déploiement Local

- Chaque instance locale = container Docker LogicAI séparé
- Volumes isolés pour persister les données de chaque instance
- Ports uniques pour éviter les conflits (ex: 5678, 5679, 5680...)
- Arrêt/Suppression propre des containers via backend local

## Processus de Création d'Instance

### Modal de Création

- **Bouton "Nouvelle instance"** dans le dashboard
- **Modal avec 2 cartes** :
  - **Instance Locale** : Icône Docker Desktop + "Exécution locale avec Docker"
  - **Instance Cloud** : Icône Cloud + "Hébergement LogicAI"
- **Création automatique** après sélection via API
- **Ouverture automatique** dans nouvel onglet
- **Vérification des limites** du plan utilisateur (free=1, pro=5, admin=20)

### Flux

1. Clic "Nouvelle instance"
2. Modal choix Local/Cloud
3. Création API (identique dashboard web)
4. Ouverture automatique onglet
5. Badge visuel (LOCAL ou URL)

## Stack Technique

### Frontend Tauri

- **Core** : React 19 + TypeScript + Vite + Tailwind CSS
- **Routing** : React Router v7 avec routes imbriquées
- **UI** : Lucide React + Radix UI + Framer Motion
- **Icons** : Simple Icons (déjà configuré)

### Dépendances Copiées

Depuis `web/package.json` :
- GSAP, Three.js, Motion, React Router, Tailwind, etc.

Depuis `docker-instance/web/package.json` :
- @xyflow/react, i18next, react-markdown, axios, etc.

### Communication

- **Tauri → Backend local** : HTTP (localhost:port auto)
- **Backend local → API LogicAI** : WebSocket (sync temps réel)
- **Tauri → API LogicAI** : HTTP direct (auth, création instances)
- **Onglets locaux → Container local** : WebSocket
- **Onglets cloud → API Cloud** : WebSocket direct

## Gestion de l'État

### Contexts Partagés

- **AuthContext** : Token, user profile, logout (global entre dashboard et onglets)
- **WebSocketContext** : Connexion unique WebSocket pour mises à jour temps réel
- **TabsContext** : Liste des onglets ouverts, onglet actif, actions (fermer, réorganiser)
- **ExecutionContext** : État local par onglet instance (workflow, nodes, edges)
- **ToastContext** : Notifications partagées entre tous les onglets

### Synchronisation

- **Chaque onglet indépendant** : État local React
- **Auto-save local** : Sauvegarde automatique dans cloud via WebSocket
- **Refresh automatique** : Dashboard reçoit mises à jour via WebSocket
- **Offline possible** : Onglets fonctionnent temporairement offline, sync au retour
- **Persistance** : Fermeture/rouverture restaure les onglets ouverts

## Expérience Utilisateur

### Flux Complet

1. **Premier lancement** : Écran login/register
2. **Connexion** : Redirection automatique dashboard
3. **Dashboard** : Vue d'ensemble instances (locales + cloud)
4. **Création** : Bouton "Nouvelle instance" → Modal → Création auto
5. **Onglet** : Ouverture automatique avec interface LogicAI
6. **Navigation** : Clic entre onglets instantané
7. **Gestion** : Start/stop/delete depuis dashboard ou onglet

### Patterns UI

- **Modal création** : Cartes visuelles pour choix Local/Cloud
- **Animations** : Transitions fluides style Figma (glissement, fade)
- **État persistant** : Restaure onglets ouverts à fermeture/rouverture
- **Shortcuts** : Ctrl+T (nouvel onglet), Ctrl+W (fermer), Ctrl+Tab (naviguer)

## Sécurité

### Mesures

- **Auth unifiée** : JWT partagé avec dashboard web
- **Backend sécurisé** : Service Node.js local n'accepte que connexions localhost
- **Docker safety** : Vérification configuration Docker Desktop
- **Isolation** : Containers isolés avec volumes et réseaux propres
- **API Keys** : Stockées encrypted, utilisables par instances locales
- **HTTPS** : Communication avec API cloud en HTTPS uniquement

## Déploiement

### Packaging

- **Build unique** : Exécutable unique pour Windows/Mac/Linux
- **Backend inclus** : Service Node.js packagé avec l'app
- **Auto-update** : Système de mise à jour intégré via Tauri
- **Configuration minimale** : Docker Desktop requis pour instances locales

### Installation

- **Détection Docker** : Vérifie installation Docker Desktop
- **Guided setup** : Propose installation Docker si nécessaire
- **Port auto** : Backend local utilise port disponible automatiquement

## Structure des Fichiers

```
app/
├── src-tauri/          # Code Rust Tauri
├── src/
│   ├── components/
│   │   ├── tabs/       # Système d'onglets
│   │   ├── auth/       # Login/Register (depuis web/)
│   │   ├── dashboard/  # Dashboard (depuis web/)
│   │   └── workflow/   # Interface n8n (depuis docker-instance/web/)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── WebSocketContext.tsx
│   │   ├── TabsContext.tsx
│   │   └── ExecutionContext.tsx
│   ├── services/
│   │   ├── api.ts      # API LogicAI
│   │   └── local.ts    # Communication backend local
│   ├── router.tsx
│   └── App.tsx
└── backend-local/      # Service Node.js local
    ├── server.js
    ├── docker.js       # Gestion Docker Engine
    └── package.json
```

## Implémentation

### Phases

1. **Phase 1** : Setup Tauri + Auth + Dashboard
2. **Phase 2** : Système d'onglets + TabsContext
3. **Phase 3** : Backend local + gestion Docker
4. **Phase 4** : Intégration interface docker-instance/web
5. **Phase 5** : Modal création instances (Local/Cloud)
6. **Phase 6** : Synchronisation + Auto-save
7. **Phase 7** : Tests + Packaging

### Priorités

- **Critique** : Auth, Dashboard, système d'onglets
- **Important** : Backend local, création instances locales
- **Optionnel** : Animations avancées, shortcuts

## Notes

- L'app Tauri sera **uniquement** une application de bureau (pas de version web)
- Les instances cloud utilisent la même interface que docker-instance/web
- Le backend local est **transparent** pour l'utilisateur (pas de configuration manuelle)
- La synchronisation est **automatique** et transparente
- Le design system est **identique** aux projets web existants
