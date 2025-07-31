import { saveRule } from '../services/db.service.js';
import logger from '../logger.js';

async function applyRules(rules) {
  logger.error(`[apply_rules_db]: ${rules}`);
  try {
    if (!Array.isArray(rules)) {
      throw new Error('Input must be an array of rules.');
    }
    const results = [];
    for (const rule of rules) {
      try {
        const { rule_name, description, scope, language, rule_content, categories } = rule;
        const result = saveRule(rule_name, description, scope, language, rule_content, categories);
        results.push(result);
      } catch (error) {
        logger.error(`[apply_rules_db]: Error applying rule - ${error.message}`);
        results.push(`Error applying rule for db: ${error.message}`);
      }
    }

    return results.join('\\n');
  } catch (error) {
    logger.error(`[apply_rules_db]: Error applying rules for db - ${error.message}`);
    throw new Error(`Error applying rules for db: ${error.message}`);
  }
}

export default applyRules;