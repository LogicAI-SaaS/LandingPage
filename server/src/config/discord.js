// Discord OAuth Configuration
const discordConfig = {
  clientId: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/auth/discord/callback',
  scopes: ['identify', 'email'],
  apiUrl: 'https://discord.com/api/v10',
  authorizationUrl: 'https://discord.com/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/v10/oauth2/token',
};

module.exports = discordConfig;
