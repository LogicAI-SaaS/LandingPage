/**
 * Exemple: Traitement de formulaire avec validation
 * 
 * Ce fichier montre comment:
 * - Valider les données d'un formulaire
 * - Trigger un workflow avec ces données
 * - Gérer les erreurs proprement
 */

import { LogicAIClient, ValidationError, TokenExpiredError } from '../src';

// Configuration
const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL || 'http://localhost:3000',
  token: process.env.LOGICAI_TOKEN || 'your-token-here',
});

const INSTANCE_UUID = process.env.INSTANCE_UUID || 'your-instance-uuid';

// Interface pour les données du formulaire
interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Validation simple
function validateForm(data: ContactForm): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push('Email invalide');
  }

  if (!data.subject || data.subject.length < 5) {
    errors.push('Le sujet doit contenir au moins 5 caractères');
  }

  if (!data.message || data.message.length < 10) {
    errors.push('Le message doit contenir au moins 10 caractères');
  }

  return errors;
}

// Fonction principale de traitement
async function handleContactForm(formData: ContactForm) {
  console.log('📝 Traitement du formulaire de contact...');

  // Validation
  const validationErrors = validateForm(formData);
  if (validationErrors.length > 0) {
    console.error('❌ Erreurs de validation:');
    validationErrors.forEach(err => console.error(`  - ${err}`));
    return { success: false, errors: validationErrors };
  }

  try {
    // Trigger le workflow
    console.log('🚀 Envoi vers le workflow...');
    
    const result = await client.workflows.webhook({
      instanceUuid: INSTANCE_UUID,
      webhookPath: 'contact-form',
      data: {
        ...formData,
        timestamp: new Date().toISOString(),
        source: 'website',
        ip: '127.0.0.1' // À remplacer par l'IP réelle
      }
    });

    console.log('✅ Formulaire traité avec succès!');
    console.log('Résultat:', result);

    return { success: true, data: result };
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      console.error('🔐 Session expirée. Veuillez vous reconnecter.');
      return { success: false, error: 'Session expirée' };
    } else if (error instanceof ValidationError) {
      console.error('⚠️ Erreur de validation:', error.message);
      return { success: false, error: error.message, details: error.details };
    } else {
      console.error('❌ Erreur lors du traitement:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Exemple d'utilisation
async function main() {
  const formData: ContactForm = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subject: 'Demande d\'information',
    message: 'Bonjour, je souhaite obtenir plus d\'informations sur vos services.'
  };

  const result = await handleContactForm(formData);
  
  if (result.success) {
    console.log('\n🎉 Succès!');
  } else {
    console.log('\n💥 Échec:', result.error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { handleContactForm };
