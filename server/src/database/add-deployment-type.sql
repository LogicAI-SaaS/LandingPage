-- Migration pour ajouter le champ deployment_type à la table instances
-- Exécuter ce script pour mettre à jour la base de données existante

-- Ajouter la colonne deployment_type si elle n'existe pas
ALTER TABLE instances
ADD COLUMN IF NOT EXISTS deployment_type ENUM('local', 'cloud') DEFAULT 'cloud' AFTER status;

-- Ajouter la colonne public_url pour stocker l'URL accessible (ngrok, domaine, etc.)
ALTER TABLE instances
ADD COLUMN IF NOT EXISTS public_url VARCHAR(255) NULL AFTER subdomain;

-- Mettre à jour les instances existantes pour qu'elles soient de type 'cloud'
UPDATE instances SET deployment_type = 'cloud' WHERE deployment_type IS NULL;

-- Ajouter un index pour optimiser les requêtes sur deployment_type
CREATE INDEX IF NOT EXISTS idx_deployment_type ON instances(deployment_type);

-- Afficher un résumé
SELECT
    deployment_type,
    COUNT(*) as count
FROM instances
GROUP BY deployment_type;
