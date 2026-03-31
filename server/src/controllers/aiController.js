const axios = require('axios');

const ZAI_API_URL = process.env.ZAI_API_URL || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';

/**
 * Generate workflow using Z.ai GLM 4.7
 */
exports.generateWorkflow = async (req, res) => {
  try {
    const { messages } = req.body;

    // Validation
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // Vérifier que la clé API est configurée
    if (!ZAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Z.ai API key not configured on server'
      });
    }

    // Appel à l'API Z.ai
    const response = await axios.post(
      ZAI_API_URL,
      {
        model: 'glm-5',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
          'Authorization': `Bearer ${ZAI_API_KEY}`,
        },
      }
    );

    // Retourner la réponse de Z.ai
    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error calling Z.ai API:', error.response?.data || error.message);
    
    // Gestion des erreurs spécifiques
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: `Z.ai API error: ${error.response.statusText}`,
        details: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error while calling Z.ai',
      error: error.message
    });
  }
};

/**
 * Health check for AI service
 */
exports.healthCheck = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'AI service is running',
    configured: !!ZAI_API_KEY,
    model: 'glm-5',
    provider: 'Z.ai'
  });
};
