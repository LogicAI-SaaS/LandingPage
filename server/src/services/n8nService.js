const { transporter } = require('../config/email');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

// Générer un mot de passe temporaire sécurisé
const generateTempPassword = () => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Envoyer les identifiants ou instructions par email
const sendTempPasswordEmail = async (email, tempPasswordOrUrl, instanceUrl) => {
  try {
    // Déterminer si on a un mot de passe ou juste une URL
    const hasPassword = arguments.length === 3;
    const tempPassword = hasPassword ? tempPasswordOrUrl : null;
    const url = hasPassword ? instanceUrl : tempPasswordOrUrl;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email not configured.', hasPassword ? 'Temp password: ' + tempPassword : 'URL: ' + url);
      return { success: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LogicAI" <noreply@logicai.fr>',
      to: email,
      subject: hasPassword ? '🔐 Vos identifiants N8N - LogicAI' : '🚀 Votre instance N8N est prête - LogicAI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 LogicAI - N8N Instance</h1>
            </div>
            <div class="content">
              <h2>${hasPassword ? 'Votre compte N8N est prêt !' : 'Votre instance N8N est prête !'}</h2>
              <p>Bonjour,</p>
              <p>${hasPassword ? 'Votre compte N8N a été créé automatiquement.' : 'Votre instance N8N a été créée avec succès.'}</p>

              ${hasPassword ? `
              <div class="password-box">
                <p><strong>🔐 Vos identifiants de connexion :</strong></p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Mot de passe :</strong></p>
                <p class="password">${tempPassword}</p>
              </div>
              ` : `
              <div class="password-box">
                <p><strong>📋 Instructions de configuration initiale :</strong></p>
                <p>1. Cliquez sur le bouton ci-dessous pour accéder à votre instance</p>
                <p>2. Remplissez le formulaire de création de compte administrateur</p>
                <p>3. Utilisez l'email <strong>${email}</strong> et choisissez un mot de passe sécurisé</p>
                <p>4. Complétez les informations de profil demandées</p>
              </div>
              `}

              <p style="text-align: center;">
                <a href="${url}" class="button">Accéder à mon instance N8N</a>
              </p>

              <p><strong>⚠️ Important :</strong></p>
              <ul>
                <li>${hasPassword ? 'Conservez vos identifiants en lieu sûr' : 'Vous devrez créer votre compte administrateur'}</li>
                <li>Changez votre mot de passe régulièrement</li>
                <li>N'importe quel mot de passe de 8+ caractères peut être utilisé</li>
              </ul>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par LogicAI. Merci de ne pas y répondre.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: true }; // Ne pas bloquer si l'email échoue
  }
};

// Mettre à jour le mot de passe N8N via l'API
const updateN8nPassword = async (instanceUrl, email, oldPassword, newPassword) => {
  try {
    // Créer une instance axios avec gestion des cookies
    const axiosInstance = axios.create({
      timeout: 10000,
      validateStatus: () => true,
      withCredentials: true
    });

    // Étape 1: Se connecter à N8N pour obtenir une session
    console.log('[N8N] Attempting to authenticate with N8N...');
    const loginResponse = await axiosInstance.post(
      `${instanceUrl}/login`,
      {
        email,
        password: oldPassword
      }
    );

    if (loginResponse.status !== 200 && loginResponse.status !== 204) {
      console.error('[N8N] Login failed:', loginResponse.status, loginResponse.data);
      return { success: false, message: 'Failed to authenticate with N8N' };
    }

    console.log('[N8N] Authentication successful');

    // Étape 2: Changer le mot de passe via l'API
    const changePasswordResponse = await axiosInstance.post(
      `${instanceUrl}/rest/users/change-password`,
      {
        oldPassword,
        newPassword
      }
    );

    if (changePasswordResponse.status === 204 || changePasswordResponse.status === 200) {
      console.log('[N8N] Password changed successfully');
      return { success: true };
    } else {
      console.error('[N8N] Password change failed:', changePasswordResponse.status, changePasswordResponse.data);
      return { success: false, message: 'Failed to update password in N8N' };
    }
  } catch (error) {
    console.error('[N8N] API error:', error.message);
    // Si l'API N8N échoue, on retourne un warning mais pas d'erreur bloquante
    // L'utilisateur pourra changer son mdp directement dans l'interface N8N
    return { success: true, warning: 'N8N API unavailable - please change password in N8N interface' };
  }
};

// Fonction pour créer un owner via l'API de setup N8N
const createN8nAdmin = async (instanceUrl, email, password, firstName, lastName) => {
  const maxRetries = 15;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[N8N] Attempt ${attempt}/${maxRetries} to create owner account...`);

      // Créer une instance axios avec gestion des cookies
      const axiosInstance = axios.create({
        timeout: 10000,
        validateStatus: () => true,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Essayer de créer le compte owner via l'endpoint de setup
      const setupResponse = await axiosInstance.post(
        `${instanceUrl}/rest/setup`,
        {
          email,
          password,
          firstName: firstName || 'Utilisateur',
          lastName: lastName || ''
        }
      );

      console.log(`[N8N] Setup response status: ${setupResponse.status}`);

      if (setupResponse.status === 200 || setupResponse.status === 201 || setupResponse.status === 204) {
        console.log('[N8N] ✅ Owner account created via setup endpoint');
        return { success: true };
      }

      // Si le setup est déjà complété, essayer de se connecter
      if (setupResponse.status === 400 || setupResponse.status === 404 || setupResponse.status === 409) {
        console.log('[N8N] Setup endpoint returned ' + setupResponse.status + ' - trying to login...');

        const loginResponse = await axiosInstance.post(
          `${instanceUrl}/login`,
          { email, password }
        );

        if (loginResponse.status === 200 || loginResponse.status === 204) {
          console.log('[N8N] ✅ Owner account exists and login successful');
          return { success: true };
        }
      }

      // Attendre avant de réessayer
      if (attempt < maxRetries) {
        console.log(`[N8N] Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`[N8N] Attempt ${attempt} error:`, error.message);

      // Si c'est une erreur de connexion, attendre et réessayer
      if ((error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') && attempt < maxRetries) {
        console.log(`[N8N] Connection refused - waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (attempt >= maxRetries) {
        console.log('[N8N] ⚠️  Max retries reached');
        return { success: true, warning: 'Could not create owner account - please check manually' };
      }
    }
  }

  return { success: true, warning: 'Owner account creation timed out' };
};

// Créer automatiquement un owner via la base de données
const createN8nOwnerAutomatically = async (containerName, email, password, firstName, lastName) => {
  try {
    console.log('[N8N Auto-Setup] Starting automatic owner creation...');

    // Chemin du script
    const scriptPath = path.join(__dirname, '../../scripts/create-n8n-user.js');

    // Vérifier que le script existe
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Script not found: ' + scriptPath);
    }

    // Copier le script dans le container
    console.log('[N8N Auto-Setup] Copying script to container...');
    await execPromise(`docker cp ${scriptPath} ${containerName}:/tmp/create-n8n-user.js`);

    // Exécuter le script dans le container
    console.log('[N8N Auto-Setup] Executing user creation script...');

    const command = `docker exec ${containerName} node /tmp/create-n8n-user.js /home/node/.n8n/database.sqlite "${email}" "${password}" "${firstName || 'Utilisateur'}" "${lastName || ''}"`;

    console.log('[N8N Auto-Setup] Command:', command.replace(/password="[^"]*"/, 'password="***"'));

    const { stdout, stderr } = await execPromise(command);

    if (stdout) console.log('[N8N Auto-Setup] Output:', stdout);
    if (stderr) console.log('[N8N Auto-Setup] Stderr:', stderr);

    // Vérifier si l'utilisateur a été créé avec succès
    if (stdout.includes('✅') || stdout.includes('Success')) {
      console.log('[N8N Auto-Setup] ✅ Owner account created successfully');

      // Nettoyer le script
      await execPromise(`docker exec ${containerName} rm /tmp/create-n8n-user.js`);

      return { success: true };
    }

    // Si le script a échoué, retourner un warning
    console.log('[N8N Auto-Setup] ⚠️  Script execution may have failed');
    await execPromise(`docker exec ${containerName} rm /tmp/create-n8n-user.js`);

    return { success: true, warning: 'Owner creation may have failed - please check manually' };

  } catch (error) {
    console.error('[N8N Auto-Setup] Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Envoyer l'email avec l'URL de l'instance LogicAI-N8N
const sendInstanceEmail = async (email, instanceUrl, instanceName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email not configured. Instance URL:', instanceUrl);
      return { success: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LogicAI" <noreply@logicai.fr>',
      to: email,
      subject: '🚀 Votre instance LogicAI est prête !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #f97316; margin: 20px 0; }
            .url { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #f97316; }
            .button { display: inline-block; padding: 12px 30px; background: #f97316; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 LogicAI - Instance Prête</h1>
            </div>
            <div class="content">
              <h2>Votre instance LogicAI-N8N est prête !</h2>
              <p>Bonjour,</p>
              <p>Votre instance LogicAI-N8N a été créée avec succès et est maintenant accessible.</p>

              <div class="info-box">
                <p><strong>📋 Informations de votre instance :</strong></p>
                <p><strong>Nom :</strong> ${instanceName}</p>
                <p><strong>URL d'accès :</strong></p>
                <p class="url">${instanceUrl}</p>
              </div>

              <p style="text-align: center;">
                <a href="${instanceUrl}" class="button">Accéder à mon instance</a>
              </p>

              <p><strong>📝 Instructions :</strong></p>
              <ul>
                <li>Cliquez sur le bouton ci-dessus pour accéder à votre instance</li>
                <li>Créez votre compte administrateur lors de la première connexion</li>
                <li>Utilisez votre email <strong>${email}</strong> pour vous inscrire</li>
              </ul>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par LogicAI. Merci de ne pas y répondre.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: true }; // Ne pas bloquer si l'email échoue
  }
};

module.exports = {
  generateTempPassword,
  sendTempPasswordEmail,
  sendInstanceEmail,
  updateN8nPassword,
  createN8nAdmin,
  createN8nOwnerAutomatically
};
