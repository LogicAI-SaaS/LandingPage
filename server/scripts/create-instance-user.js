/**
 * Script pour créer un utilisateur owner directement dans la base SQLite N8N
 * Utilise le module 'sqlite3' disponible dans N8N
 */
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

async function createN8nOwner(dbPath, email, password, firstName, lastName) {
  return new Promise((resolve, reject) => {
    console.log('[N8N DB] Connecting to database:', dbPath);

    // Ouvrir la base de données
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[N8N DB] Error opening database:', err.message);
        return resolve({ success: false, error: err.message });
      }
    });

    // Lister toutes les tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('[N8N DB] Error listing tables:', err.message);
        db.close();
        return resolve({ success: false, error: err.message });
      }

      console.log('[N8N DB] Available tables:', tables.map(t => t.name).join(', '));

      // Trouver la table user
      const userTable = tables.find(t =>
        t.name.toLowerCase() === 'user' ||
        t.name.toLowerCase() === 'users'
      );

      if (!userTable) {
        db.close();
        return resolve({ success: false, error: 'No user table found' });
      }

      const tableName = userTable.name;
      console.log('[N8N DB] Using table:', tableName);

      // Vérifier la structure de la table
      db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
        if (err) {
          console.error('[N8N DB] Error getting table info:', err.message);
          db.close();
          return resolve({ success: false, error: err.message });
        }

        console.log('[N8N DB] Table structure:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });

        // Vérifier si l'utilisateur existe déjà
        db.get(`SELECT * FROM ${tableName} WHERE email = ?`, [email], async (err, existingUser) => {
          if (err) {
            console.error('[N8N DB] Error checking existing user:', err.message);
            db.close();
            return resolve({ success: false, error: err.message });
          }

          if (existingUser) {
            console.log('[N8N DB] User already exists, updating password...');

            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Mettre à jour
            db.run(`UPDATE ${tableName} SET password = ? WHERE email = ?`, [hashedPassword, email], function(err) {
              if (err) {
                console.error('[N8N DB] Error updating password:', err.message);
                db.close();
                return resolve({ success: false, error: err.message });
              }

              console.log('[N8N DB] ✅ Password updated successfully');
              db.close();
              resolve({ success: true, action: 'updated' });
            });
            return;
          }

          // Créer un nouvel utilisateur
          console.log('[N8N DB] Creating new user...');

          // Hasher le mot de passe
          bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
              console.error('[N8N DB] Error hashing password:', err.message);
              db.close();
              return resolve({ success: false, error: err.message });
            }

            // Préparer les données
            const now = new Date().toISOString();
            const availableColumns = columns.map(c => c.name);

            // Colonnes requises
            const requiredColumns = ['email', 'password', 'firstName', 'lastName'];
            const columnsToInsert = requiredColumns.filter(c => availableColumns.includes(c));

            // Ajouter les colonnes optionnelles si elles existent
            if (availableColumns.includes('createdAt')) {
              columnsToInsert.push('createdAt');
            }
            if (availableColumns.includes('updatedAt')) {
              columnsToInsert.push('updatedAt');
            }
            if (availableColumns.includes('role')) {
              columnsToInsert.push('role');
            }

            // Préparer les valeurs
            const values = [];
            const placeholders = [];

            columnsToInsert.forEach(col => {
              if (col === 'email') values.push(email);
              else if (col === 'password') values.push(hashedPassword);
              else if (col === 'firstName') values.push(firstName || 'Utilisateur');
              else if (col === 'lastName') values.push(lastName || '');
              else if (col === 'createdAt') values.push(now);
              else if (col === 'updatedAt') values.push(now);
              else if (col === 'role') values.push('global:owner');

              placeholders.push('?');
            });

            const insertQuery = `INSERT INTO ${tableName} (${columnsToInsert.join(', ')}) VALUES (${placeholders.join(', ')})`;

            console.log('[N8N DB] Insert query:', insertQuery);

            db.run(insertQuery, values, function(err) {
              if (err) {
                console.error('[N8N DB] Error inserting user:', err.message);
                db.close();
                return resolve({ success: false, error: err.message });
              }

              console.log('[N8N DB] ✅ User created successfully, ID:', this.lastID);
              db.close();
              resolve({ success: true, action: 'created', userId: this.lastID });
            });
          });
        });
      });
    });
  });
}

// Export
module.exports = { createN8nOwner };

// Si exécuté directement
if (require.main === module) {
  const args = process.argv.slice(2);
  const dbPath = args[0];
  const email = args[1];
  const password = args[2];
  const firstName = args[3] || 'Utilisateur';
  const lastName = args[4] || '';

  if (!dbPath || !email || !password) {
    console.error('Usage: node create-instance-user.js <dbPath> <email> <password> [firstName] [lastName]');
    console.error('Example: node create-instance-user.js /app/data/instance.db user@example.com password123 "John" "Doe"');
    process.exit(1);
  }

  createN8nOwner(dbPath, email, password, firstName, lastName)
    .then(result => {
      if (result.success) {
        console.log('✅ Success!');
        process.exit(0);
      } else {
        console.error('❌ Failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
