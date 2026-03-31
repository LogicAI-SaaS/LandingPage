const mysql = require('mysql2');
require('dotenv').config();

// Créer un pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'logicai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Utiliser les promesses
const promisePool = pool.promise();

// Initialiser la base de données
const initDatabase = async () => {
  try {
    // Créer la base de données si elle n'existe pas
    await promisePool.query('CREATE DATABASE IF NOT EXISTS logicai_saas');
    await promisePool.query('USE logicai_saas');

    // Créer la table users
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        plan VARCHAR(50) DEFAULT 'free',
        role ENUM('user', 'mod', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_plan (plan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ajouter un index sur la colonne plan si elle n'existe pas déjà
    try {
      await promisePool.query('CREATE INDEX idx_plan ON users(plan)');
    } catch (error) {
      // L'index existe déjà
    }

    // Ajouter la colonne role si elle n'existe pas (pour les bases de données existantes)
    try {
      await promisePool.query(`
        ALTER TABLE users
        ADD COLUMN role ENUM('user', 'mod', 'admin') DEFAULT 'user'
      `);
      await promisePool.query('CREATE INDEX idx_role ON users(role)');
    } catch (error) {
      // L'erreur est normale si la colonne existe déjà
      if (!error.message.includes('Duplicate column name')) {
        console.error('Warning:', error.message);
      }
    }

    // Créer la table instances
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS instances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        port INT,
        status ENUM('creating', 'running', 'stopped', 'error', 'deleted') DEFAULT 'creating',
        container_id VARCHAR(255),
        temp_password VARCHAR(255),
        password_set BOOLEAN DEFAULT FALSE,
        n8n_email VARCHAR(255),
        is_shared BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_uuid (uuid),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ajouter les colonnes de mot de passe si elles n'existent pas
    try {
      await promisePool.query(`
        ALTER TABLE instances
        ADD COLUMN temp_password VARCHAR(255)
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.error('Warning:', error.message);
      }
    }

    try {
      await promisePool.query(`
        ALTER TABLE instances
        ADD COLUMN password_set BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.error('Warning:', error.message);
      }
    }

    try {
      await promisePool.query(`
        ALTER TABLE instances
        ADD COLUMN n8n_email VARCHAR(255)
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.error('Warning:', error.message);
      }
    }

    // Créer la table instance_members
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS instance_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        instance_id INT NOT NULL,
        user_id INT,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role ENUM('viewer', 'collaborator', 'admin', 'owner') DEFAULT 'viewer',
        temp_password VARCHAR(255),
        password_set BOOLEAN DEFAULT FALSE,
        invitation_token VARCHAR(255),
        invitation_status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_instance_id (instance_id),
        INDEX idx_user_id (user_id),
        INDEX idx_invitation_token (invitation_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = { promisePool, initDatabase };
