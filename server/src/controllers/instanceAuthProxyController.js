const Instance = require('../models/Instance');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const INSTANCE_JWT_SECRET = 'logicai-instance-secret-key-change-in-production';
const INSTANCE_JWT_EXPIRES_IN = '7d';

/**
 * Génère un token d'authentification pour une instance
 * Utilise l'approche directe avec JWT signé partagé entre LogicAI et l'instance
 */
exports.getInstanceAuthToken = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user.id;

    console.log(`[Instance Auth Proxy] Generating auth token for user ${userId}, instance ${uuid}`);

    // Récupérer l'instance
    const instance = await Instance.findByUuid(uuid);
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }

    // Vérifier que l'instance appartient à l'utilisateur
    if (instance.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette instance'
      });
    }

    // Vérifier que l'instance est en cours d'exécution
    if (instance.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'L\'instance n\'est pas en cours d\'exécution'
      });
    }

    // Récupérer les infos utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer un token JWT signé avec le secret de l'instance
    const instanceToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        instanceId: instance.uuid,
        firstName: user.first_name,
        lastName: user.last_name
      },
      INSTANCE_JWT_SECRET,
      { expiresIn: INSTANCE_JWT_EXPIRES_IN }
    );

    console.log('[Instance Auth Proxy] Direct token generated successfully');

    res.json({
      success: true,
      data: {
        instanceToken,
        instanceUrl: `http://localhost:${instance.port}`,
        instanceId: instance.uuid,
        user: {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });

  } catch (error) {
    console.error('[Instance Auth Proxy] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du token',
      error: error.message
    });
  }
};

/**
 * Alias pour getInstanceAuthToken (même fonction)
 */
exports.getInstanceDirectToken = async (req, res) => {
  return exports.getInstanceAuthToken(req, res);
};
