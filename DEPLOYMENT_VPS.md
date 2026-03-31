# 🚀 Guide Déploiement LogicAI VPS (Debian 13)

## 📋 Architecture

Ce projet contient 3 applications:

```
┌─────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)             │
│  ┌────────────────────────────────────────────┐ │
│  │ Web Frontend (Port 5173)                   │ │
│  │ / → React SPA                             │ │
│  ├────────────────────────────────────────────┤ │
│  │ Mobile App (Port 19006)                    │ │
│  │ / → React Native Expo                      │ │
│  ├────────────────────────────────────────────┤ │
│  │ Desktop App (Port 1420)                     │ │
│  │ / → Tauri Application                    │ │
│  ├────────────────────────────────────────────┤ │
│  │ Backend API (Port 3000)                     │ │
│  │ / → Node.js + Express + PostgreSQL         │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🔧 Prérequis VPS

- **VPS**: Debian 13 avec au moins 2GB RAM (4GB recommandé)
- **Accès**: Root ou utilisateur avec sudo
- **Domaine**: Example: `logicai.fr` (avec DNS configuré)

## 1️⃣ Mise à Jour du Système

```bash
# Mise à jour des paquets
sudo apt update && sudo apt upgrade -y

# Installation des outils de base
sudo apt install -y curl wget git gnupg2 build-essential

# Node.js 20.x (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification
node --version  # v20.x.x
npm --version   # 10.x.x
```

## 2️⃣ Installation PostgreSQL

```bash
# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer base de données et utilisateur
sudo -u postgres psql
```

Dans psql:
```sql
-- Créer utilisateur et BDD
CREATE USER logicai WITH PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
CREATE DATABASE logicai OWNER logicai;
GRANT ALL PRIVILEGES ON DATABASE logicai TO logicai;
\q
```

## 3️⃣ Installation Docker (pour instances cloud)

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Donner les droits Docker à l'utilisateur
sudo usermod -aG docker $USER

# Recharger pour appliquer les groupes
newgrp docker

# Vérifier
docker --version
```

## 4️⃣ Installation PM2 (Gestion des processus)

```bash
sudo npm install -g pm2
pm2 --version
```

## 5️⃣ Installation Prisma & Setup Backend

```bash
# Cloner le repo
cd /var/www
sudo git clone https://github.com/VOTRE_REPO.git logicai
cd logicai/server

# Installer les dépendances
npm install

# Configurer .env
nano .env
```

**Variables .env:**
```env
NODE_ENV=production
PORT=3000

# Base de données PostgreSQL
DATABASE_URL="postgresql://logicai:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/logicai?schema=public"

# JWT
JWT_SECRET="CHANGE_THIS_SUPER_SECRET_KEY_PRODUCTION"

# CORS (ajouter vos domaines)
CORS_ORIGIN="https://logicai.fr,https://www.logicai.fr"

# Email (configure ton SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=LogicAI <noreply@logicai.fr>

# Discord OAuth (optionnel)
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://logicai.fr/login

# Docker
DOCKER_SOCKET=/var/run/docker.sock
```

```bash
# Initialiser Prisma
npx prisma generate
npx prisma db push
```

## 6️⃣ Build & Configuration Web

```bash
cd ../web

# Installer les dépendances
npm install

# Configuration .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://logicai.fr/api
EOF

# Build pour production
npm run build
```

## 7️⃣ Configuration Mobile

```bash
cd ../mobile

# Installer les dépendances
npm install

# Configuration app.json pour production
cat > app.config.js << 'EOF'
export default {
  name: "LogicAI",
  slug: "logicai",
  version: "1.0.0.0",
  scheme: "https",
  android: {
    adaptiveIcon: {
      backgroundColor: "#0070FF"
    }
  },
  web: {
    bundler: "metro"
  },
  extra: {
    eas: {
      projectId: "logicai-mobile-app"
    }
  }
}
EOF

# Build Android (optionnel)
# eas build --platform android
```

## 8️⃣ Configuration Desktop

```bash
cd ../app

# Installer les dépendances
npm install

# Configuration pour production
cat > src-tauri/tauri.conf.json << 'EOF'
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "LogicAI",
  "version": "1.0.0",
  "identifier": "com.logicai.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "https://logicai.fr",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "LogicAI",
        "width": 1200,
        "height": 800,
        "decorations": false
      }
    ]
  }
}
EOF
```

Build Desktop:
```bash
npm run build
```

## 9️⃣ Configuration Nginx

```bash
# Créer la configuration nginx
sudo nano /etc/nginx/sites-available/logicai
```

**Configuration nginx complète:**
```nginx
# /etc/nginx/sites-available/logicai

# HTTP → HTTPS redirection
server {
    listen 80;
    listen [::]:80;
    server_name logicai.fr www.logicai.fr;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name logicai.fr www.logicai.fr;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/logicai.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/logicai.fr/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend Web (Build React statique)
    location / {
        root /var/www/logicai/web/dist;
        try_files $uri $uri/ /index.html;

        # Cache assets statiques
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket (support)
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Mobile App (Expo - optionnel pour le futur)
    location /mobile/ {
        proxy_pass http://127.0.0.1:19006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Desktop App (Tauri - optionnel pour le futur)
    location /desktop/ {
        proxy_pass http://127.0.0.1:1420;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Prisma Studio (optionnel - sécuriser avec IP whitelist)
    location /prisma-studio {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        # Sécuriser avec IP whitelist
        # allow 1.2.3.4; # Remplacer par ton IP
        # deny all;
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

Activer le site:
```bash
sudo ln -s /etc/nginx/sites-available/logicai /etc/nginx/sites-enabled/
sudo nginx -t
```

## 🔟 Installation SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir certificat SSL
sudo certbot --nginx -d logicai.fr -d www.logicai.fr

# Renouvellement auto (cron)
sudo crontab -e
```

Ajouter:
```
0 0,12 * * * certbot renew --quiet
```

## 1️⃣1️⃣ Configuration Services Systemd

**Créer le service Backend:**
```bash
sudo nano /etc/systemd/systemd/logicai-backend.service
```

```ini
[Unit]
Description=LogicAI Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/logicai/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Démarrer les services:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable logicai-backend
sudo systemctl start logicai-backend

# Vérifier
sudo systemctl status logicai-backend
```

## 1️⃣2️⃣ Test & Déploiement

```bash
# Test Backend
curl http://localhost:3000/api

# Si besoin, voir les logs
sudo journalctl -u logicai-backend -f

# Reload nginx
sudo systemctl reload nginx
```

## 1️⃣3️⃣ Firewall (UFW)

```bash
# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Autoriser SSH
sudo ufw allow 22/tcp

# Activer firewall
sudo ufw enable
```

## 🔐 Sécurité Additionnelle

### 1. Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Ports Non-Sécurisés

**Fermer les ports directs du backend:**
- Ne pas exposer port 3000 publiquement
- Utiliser uniquement nginx (80/443)

### 3. Variables d'Environnement SENSIBLE

```bash
# Dans /var/www/logicai/server/.env
DATABASE_URL="postgresql://logicai:STRONG_PASSWORD_HERE@localhost:5432/logicai"
JWT_SECRET="ULTRA_SECURE_RANDOM_STRING_HERE"
```

Générer des mots de passe sécurisés:
```bash
openssl rand -base64 32
```

## 📊 Monitoring

### Logs Backend

```bash
# Voir les logs en temps réel
sudo journalctl -u logicai-backend -f

# Dernières lignes
sudo journalctl -u logicai-backend -n 50
```

### Logs Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring avec PM2

```bash
# Liste des applications
pm2 list

# Montrer le dashboard
pm2 monit

# Voir les logs
pm2 logs logicai-backend
```

## 🔄 Mise à Jour Déploiement

```bash
# Se placer dans le répertoire
cd /var/www/logicai

# Pull latest changes
git pull origin main

# Mise à jour des dépendances
cd server && npm install
cd ../web && npm install

# Build web
npm run build

# Restart backend
sudo systemctl restart logicai-backend

# Reload nginx
sudo systemctl reload nginx
```

## 🧪 Tests Post-Déploiement

```bash
# 1. Test API
curl https://logicai.fr/api/health

# 2. Test Web
curl -I https://logicai.fr/

# 3. Test SSL
curl https://www.ssllabs.com/ssltest/analyze.html?d=logicai.fr

# 4. Test Instances Cloud
docker ps
```

## 📱 Accès Applications

### Web
- **URL**: https://logicai.fr
- **Type**: React SPA déployée
- **Auth**: Backend API

### Mobile
- **URL**: https://logicai.fr/mobile (à configurer)
- **Type**: Expo (à héberger ou utiliser EAS)
- **Alternative**: Scanner le QR code depuis Expo Go

### Desktop
- **URL**: https://logicai.fr/desktop (à configurer)
- **Download**: https://logicai.fr/desktop/build
- **Type**: Tauri Application

## 🆘 Support & Debug

### Vérifier les services

```bash
# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Backend LogicAI
sudo systemctl status logicai-backend

# Docker
sudo systemctl status docker
```

### Ports utilisés

| Service | Port | Accès |
|---------|------|--------|
| Nginx | 80, 443 | Public |
| Backend API | 3000 | Local seulement (via nginx) |
| Web | 5173 | Local seulement (via nginx) |
| Mobile (dev) | 19006 | Local seulement |
| Desktop (dev) | 1420 | Local seulement |

### Problèmes courants

**Port 3000 occupé:**
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
```

**Permissions denied:**
```bash
sudo chown -R www-data:www-data /var/www/logicai
```

**Build échoue:**
```bash
# Vider cache npm
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentation Utile

- **Backend Logs**: `sudo journalctl -u logicai-backend -f`
- **Nginx Config**: `/etc/nginx/sites-available/logicai`
- **Systemd Services**: `/etc/systemd/systemd/logicai-backend.service`
- **Environment**: `/var/www/logicai/server/.env`

## ✅ Checklist Déploiement

- [ ] Système à jour
- [ ] Node.js 20.x installé
- [ ] PostgreSQL installé et configuré
- [ ] Docker installé
- [ ] PM2 installé
- [ ] Repo cloné
- [�️ Backend installé et configuré
- [ ] Database initialisée (Prisma)
- [ ] Web buildé
- [ ] Nginx configuré
- [ ] SSL installé (Let's Encrypt)
- [ ] Services systemd créés
- [ ] Firewall configuré
- [ ] Domaine DNS configuré
- [ ] Tests effectués

---

**VPS prêt !** 🚀

URLs:
- 🌐 Web: https://logicai.fr
- 📱 Mobile: https://logicai.fr/mobile
- 🖥️ Desktop: https://logicai.fr/desktop
- 🔧 API: https://logicai.fr/api
- 📊 Prisma Studio: https://logicai.fr/prisma-studio (sécurisé)
