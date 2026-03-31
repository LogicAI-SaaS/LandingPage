const mysql = require('mysql2/promise');

async function createBetaTables() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'logicai_saas'
  });

  try {
    // Créer la table beta_access
    await conn.query(`
      CREATE TABLE IF NOT EXISTS beta_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        beta_key VARCHAR(64) NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_beta_key (beta_key),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table beta_access created');

    // Créer la table beta_keys
    await conn.query(`
      CREATE TABLE IF NOT EXISTS beta_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_code VARCHAR(64) NOT NULL UNIQUE,
        max_uses INT DEFAULT 1,
        used_count INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        INDEX idx_key_code (key_code),
        INDEX idx_is_active (is_active),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table beta_keys created');

    // Ajouter les colonnes à la table users
    try {
      await conn.query(`
        ALTER TABLE users
        ADD COLUMN beta_access_id INT NULL,
        ADD COLUMN has_beta_access TINYINT(1) DEFAULT 0,
        ADD FOREIGN KEY (beta_access_id) REFERENCES beta_access(id) ON DELETE SET NULL
      `);
      console.log('✅ Columns added to users table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_CANT_CREATE_TABLE') {
        console.log('⚠️  Columns may already exist in users table');
      } else {
        throw e;
      }
    }

    console.log('\n🎉 Beta tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating beta tables:', error.message);
  } finally {
    await conn.end();
  }
}

createBetaTables();
