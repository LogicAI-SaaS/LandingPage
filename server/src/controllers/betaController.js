const BetaAccess = require('../models/BetaAccess');
const BetaKey = require('../models/BetaKey');

// S'inscrire à la bêta
const signup = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    // Vérifier si l'email est déjà inscrit
    const existing = await BetaAccess.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà inscrit à la bêta' });
    }

    // Créer l'inscription
    await BetaAccess.create(email);

    res.json({
      success: true,
      message: 'Inscription réussie ! Vous serez noté lorsqu\'une clé sera disponible.'
    });
  } catch (error) {
    console.error('Beta signup error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Valider une clé bêta
const validateKey = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ success: false, message: 'Clé manquante' });
    }

    // Trouver la clé
    const betaKey = await BetaKey.findByKeyCode(key);

    if (!betaKey) {
      return res.status(404).json({ success: false, message: 'Clé invalide' });
    }

    // Vérifier si la clé n'a pas dépassé le nombre d'utilisations
    if (betaKey.used_count >= betaKey.max_uses) {
      return res.status(400).json({ success: false, message: 'Cette clé a atteint sa limite d\'utilisation' });
    }

    // Vérifier l'expiration
    if (betaKey.expires_at && new Date(betaKey.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cette clé a expiré' });
    }

    res.json({ success: true, message: 'Clé valide' });
  } catch (error) {
    console.error('Beta key validation error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Activer une clé bêta pour un utilisateur
const activateKey = async (req, res) => {
  try {
    const { key } = req.body;
    const userId = req.user?.id;

    if (!key || !userId) {
      return res.status(400).json({ success: false, message: 'Clé ou utilisateur manquant' });
    }

    // Trouver la clé
    const betaKey = await BetaKey.findByKeyCode(key);

    if (!betaKey) {
      return res.status(404).json({ success: false, message: 'Clé invalide' });
    }

    // Vérifier si la clé n'a pas dépassé le nombre d'utilisations
    if (betaKey.used_count >= betaKey.max_uses) {
      return res.status(400).json({ success: false, message: 'Cette clé a atteint sa limite d\'utilisation' });
    }

    // Mettre à jour l'utilisateur avec l'accès bêta
    const db = require('../config/database');
    await db.promise().execute(
      'UPDATE users SET has_beta_access = 1, beta_access_id = ? WHERE id = ?',
      [betaKey.id, userId]
    );

    // Incrémenter l'utilisation de la clé
    await BetaKey.incrementUsage(key);

    res.json({ success: true, message: 'Accès bêta activé avec succès' });
  } catch (error) {
    console.error('Beta key activation error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Admin: Générer une nouvelle clé bêta
const generateKey = async (req, res) => {
  try {
    const { maxUses = 1, expiresAt } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    // Générer une clé unique
    let keyCode;
    let attempts = 0;
    do {
      keyCode = BetaKey.generateKey();
      const existing = await BetaKey.findByKeyCode(keyCode);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ success: false, message: 'Impossible de générer une clé unique' });
    }

    // Créer la clé
    const keyId = await BetaKey.create(keyCode, maxUses, createdBy, expiresAt);

    // Trouver les inscriptions en attente et assigner des clés
    const pendingSignups = await BetaAccess.getAllPending();
    for (const signup of pendingSignups) {
      if (maxUses > 0) {
        await BetaAccess.assignKey(signup.id, keyCode);
        maxUses--;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      message: 'Clé générée avec succès',
      data: { key: keyCode, id: keyId }
    });
  } catch (error) {
    console.error('Beta key generation error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Admin: Obtenir toutes les inscriptions
const getAllSignups = async (req, res) => {
  try {
    const signups = await BetaAccess.getAll();
    res.json({ success: true, data: signups });
  } catch (error) {
    console.error('Get signups error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Admin: Obtenir toutes les clés
const getAllKeys = async (req, res) => {
  try {
    const keys = await BetaKey.getAll();
    res.json({ success: true, data: keys });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Admin: Approuver une inscription
const approveSignup = async (req, res) => {
  try {
    const { id } = req.params;

    await BetaAccess.updateStatus(id, 'approved');

    res.json({ success: true, message: 'Inscription approuvée' });
  } catch (error) {
    console.error('Approve signup error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  signup,
  validateKey,
  activateKey,
  generateKey,
  getAllSignups,
  getAllKeys,
  approveSignup
};
