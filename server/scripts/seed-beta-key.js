const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedBetaKey() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'logicai_saas',
  });

  // Find first admin user
  const [admins] = await conn.execute("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
  if (!admins.length) {
    const [anyUser] = await conn.execute('SELECT id, email FROM users LIMIT 1');
    if (!anyUser.length) {
      console.error('No users found in database');
      await conn.end();
      return;
    }
    console.log('No admin found, using first user:', anyUser[0].email);
    var adminId = anyUser[0].id;
  } else {
    console.log('Using admin:', admins[0].email, '(id ' + admins[0].id + ')');
    var adminId = admins[0].id;
  }

  // Generate key: BETA-XXXX-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'BETA-';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }

  await conn.execute(
    'INSERT INTO beta_keys (key_code, max_uses, created_by, expires_at) VALUES (?, ?, ?, NULL)',
    [key, 100, adminId]
  );

  console.log('');
  console.log('✅ Beta key created successfully!');
  console.log('');
  console.log('  Key:', key);
  console.log('  Max uses: 100');
  console.log('  Expires: never');
  console.log('');

  await conn.end();
}

seedBetaKey().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
