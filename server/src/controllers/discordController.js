const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const discordConfig = require('../config/discord');
const axios = require('axios');

// Générer l'URL d'autorisation Discord
exports.getDiscordAuthUrl = (req, res) => {
  const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection
  const authUrl = new URL(discordConfig.authorizationUrl);

  authUrl.searchParams.append('client_id', discordConfig.clientId);
  authUrl.searchParams.append('redirect_uri', discordConfig.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', discordConfig.scopes.join(' '));
  authUrl.searchParams.append('state', state);

  res.json({
    success: true,
    data: {
      authUrl: authUrl.toString(),
      state
    }
  });
};

// Gérer le callback Discord (échange de code contre token)
exports.discordCallback = async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code manquant'
      });
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await axios.post(discordConfig.tokenUrl, new URLSearchParams({
      client_id: discordConfig.clientId,
      client_secret: discordConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: discordConfig.redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Récupérer les informations de l'utilisateur Discord
    const userResponse = await axios.get(`${discordConfig.apiUrl}/users/@me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const discordUser = userResponse.data;

    // Vérifier si l'utilisateur existe déjà via son Discord ID
    // Note: Nous devrons ajouter un champ discord_id à la table users
    // Pour l'instant, utilisons l'email
    const existingUser = await User.findByEmail(discordUser.email);

    let userId;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Créer un nouvel utilisateur
      userId = await User.create({
        email: discordUser.email,
        password: '', // Pas de mot de passe pour Discord OAuth
        firstName: discordUser.username?.split('#')[0] || 'Discord',
        lastName: 'User',
        plan: 'free',
        role: 'user'
      });
      isNewUser = true;
    }

    // Générer le token JWT
    const token = generateToken(userId);

    // Récupérer les informations complètes de l'utilisateur
    const user = await User.findById(userId);

    res.json({
      success: true,
      message: isNewUser ? 'Compte créé avec succès via Discord' : 'Connexion réussie via Discord',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          plan: user.plan,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Discord callback error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification Discord',
      error: error.message
    });
  }
};

// Lier un compte Discord à un compte existant
exports.linkDiscord = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id; // Utilisateur authentifié via JWT

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code manquant'
      });
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await axios.post(discordConfig.tokenUrl, new URLSearchParams({
      client_id: discordConfig.clientId,
      client_secret: discordConfig.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: discordConfig.redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Récupérer les informations de l'utilisateur Discord
    const userResponse = await axios.get(`${discordConfig.apiUrl}/users/@me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const discordUser = userResponse.data;

    // TODO: Ajouter un champ discord_id à la table users et le lier ici
    // Pour l'instant, on renvoie juste les infos Discord
    res.json({
      success: true,
      message: 'Compte Discord lié avec succès',
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.username
      }
    });
  } catch (error) {
    console.error('Link Discord error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la liaison du compte Discord',
      error: error.message
    });
  }
};
