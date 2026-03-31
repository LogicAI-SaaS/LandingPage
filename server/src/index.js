require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const prisma = require('./config/database');
const { initWebSocketServer } = require('./config/websocket');
const { startInstanceProxy } = require('./config/instanceProxy');
const authRoutes = require('./routes/auth');
const instanceRoutes = require('./routes/instances');
const instanceAuthProxyRoutes = require('./routes/instanceAuthProxy');
const adminRoutes = require('./routes/admin');
const discordRoutes = require('./routes/discord');
const betaRoutes = require('./routes/beta');
const planRoutes = require('./routes/plans');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins
    if (corsOrigins.includes(origin)) return callback(null, true);
    // Allow all *.logicai.fr subdomains (instance subdomains)
    if (/^https:\/\/[a-f0-9]{8}\.logicai\.fr$/.test(origin)) return callback(null, true);
    // Allow Tauri desktop app
    if (origin === 'http://tauri.localhost' || origin === 'tauri://localhost') return callback(null, true);
    // Allow Tauri and local dev ports
    if (/^http:\/\/localhost:(1420|5[678]\d{2}|300\d)$/.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LogicAI API Server',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Instance routes
app.use('/api/instances', instanceRoutes);

// Instance auth proxy routes (auto-login)
app.use('/api/instances', instanceAuthProxyRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Discord OAuth routes
app.use('/api/discord', discordRoutes);

// Beta access routes
app.use('/api/beta', betaRoutes);

// Plan routes
app.use('/api/plans', planRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    console.log('✅ Database connected (PostgreSQL + Prisma)');

    // Créer le serveur HTTP
    const server = http.createServer(app);

    // Initialiser le serveur WebSocket
    initWebSocketServer(server);

    // Démarrer le proxy pour les sous-domaines d'instances
    startInstanceProxy(3001);

    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`
      🚀 LogicAI Server is running!

      📍 Local:            http://localhost:${PORT}
      🔑 Environment:       ${process.env.NODE_ENV || 'development'}
      📊 Database:          ${process.env.DB_NAME || 'logicai_saas'}

      API Endpoints:
      • POST   /api/auth/register  - Inscription
      • POST   /api/auth/login     - Connexion
      • GET    /api/auth/profile   - Profil utilisateur (protégé)
      • POST   /api/instances/create - Créer une instance LogicAI
      • GET    /api/instances/list   - Lister les instances

      WebSocket:
      • WS    /ws                 - Real-time updates
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
