require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const prisma = require('./config/database');
const { initWebSocketServer } = require('./config/websocket');
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
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:1420',   // Tauri app dev server
    'http://localhost:5678',   // Instance LogicAI
    'http://localhost:5679',   // Autres instances possibles
    'http://localhost:5680',
    /^http:\/\/localhost:56\d{2}$/,  // Regex pour autoriser tous les ports 56xx
    /^http:\/\/localhost:300\d{1}$/,  // Regex pour autoriser les ports 3000-3099
  ],
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
