# LogicAI Backend API

Backend Node.js avec Express et MySQL pour LogicAI.

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- MySQL (v5.7 ou supérieur) ou MariaDB

## 🚀 Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env` dans le dossier racine :

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=logicai_saas

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

3. **Démarrer MySQL**

Assurez-vous que votre serveur MySQL est en cours d'exécution.

4. **Lancer le serveur**

En mode développement avec auto-reload :
```bash
npm run dev
```

En mode production :
```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

## 📡 API Endpoints

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Obtenir le profil (protégé)
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Santé du serveur
```http
GET /api/health
```

## 📁 Structure du projet

```
server/
├── src/
│   ├── config/
│   │   └── database.js       # Configuration MySQL
│   ├── controllers/
│   │   └── authController.js # Logique d'authentification
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT
│   ├── models/
│   │   └── User.js           # Modèle utilisateur
│   ├── routes/
│   │   └── auth.js           # Routes d'authentification
│   ├── utils/
│   │   └── auth.js           # Utilitaires (JWT, bcrypt)
│   └── index.js              # Point d'entrée
├── .env                      # Variables d'environnement
├── .env.example              # Exemple de variables
└── package.json
```

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcryptjs
- Utilisation de JWT pour l'authentification
- Protection CORS configurée
- Validation des entrées

## 🗄️ Base de données

La table `users` est créée automatiquement au premier démarrage :

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🧪 Tester l'API

### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Jean",
    "lastName": "Dupont"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Profil (avec token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <votre_token>"
```

## 📝 Notes

- Le serveur crée automatiquement la base de données et les tables au démarrage
- Les tokens JWT expirent après 7 jours (configurable)
- Le plan par défaut est 'free'
