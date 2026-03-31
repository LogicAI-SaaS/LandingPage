-- Créer la table plans pour stocker les différents plans d'abonnement
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  max_instances INT NOT NULL DEFAULT 1,
  max_workflows INT NOT NULL DEFAULT 10,
  max_storage_gb INT NOT NULL DEFAULT 1,
  max_executions_per_month INT NOT NULL DEFAULT 1000,
  features JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les plans par défaut
INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, max_instances, max_workflows, max_storage_gb, max_executions_per_month, features, is_active) VALUES
('free', 'Free', 'Plan gratuit pour démarrer avec LogicAI', 0.00, 0.00, 1, 10, 1, 1000, 
  JSON_OBJECT(
    'support', 'community',
    'custom_domain', false,
    'advanced_analytics', false,
    'priority_support', false,
    'white_label', false,
    'api_access', false,
    'team_collaboration', false,
    'sla_guarantee', false
  ), 1),

('pro', 'Pro', 'Plan professionnel pour les utilisateurs avancés', 29.99, 299.00, 5, 100, 10, 50000,
  JSON_OBJECT(
    'support', 'email',
    'custom_domain', true,
    'advanced_analytics', true,
    'priority_support', false,
    'white_label', false,
    'api_access', true,
    'team_collaboration', true,
    'sla_guarantee', false
  ), 1),

('business', 'Business', 'Plan entreprise pour les équipes', 99.99, 999.00, 20, -1, 50, 500000,
  JSON_OBJECT(
    'support', 'priority',
    'custom_domain', true,
    'advanced_analytics', true,
    'priority_support', true,
    'white_label', false,
    'api_access', true,
    'team_collaboration', true,
    'sla_guarantee', true
  ), 1),

('corporation', 'Corporation', 'Plan sur mesure pour les grandes entreprises', 299.99, 2999.00, -1, -1, -1, -1,
  JSON_OBJECT(
    'support', 'dedicated',
    'custom_domain', true,
    'advanced_analytics', true,
    'priority_support', true,
    'white_label', true,
    'api_access', true,
    'team_collaboration', true,
    'sla_guarantee', true,
    'custom_integrations', true,
    'dedicated_infrastructure', true,
    'compliance_certifications', true
  ), 1)
ON DUPLICATE KEY UPDATE 
  display_name = VALUES(display_name),
  description = VALUES(description),
  price_monthly = VALUES(price_monthly),
  price_yearly = VALUES(price_yearly),
  max_instances = VALUES(max_instances),
  max_workflows = VALUES(max_workflows),
  max_storage_gb = VALUES(max_storage_gb),
  max_executions_per_month = VALUES(max_executions_per_month),
  features = VALUES(features);

-- Ajouter une clé étrangère à la table users pour référencer les plans
-- Note: Cette modification est optionnelle si vous voulez garder la colonne plan en VARCHAR
-- ALTER TABLE users ADD COLUMN plan_id INT NULL AFTER plan;
-- ALTER TABLE users ADD FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
-- CREATE INDEX idx_plan_id ON users(plan_id);
