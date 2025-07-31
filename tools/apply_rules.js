import applyRule from './apply_rule.js';
import logger from '../logger.js';

async function applyRules(rules) {
  logger.error(`[apply_rules]: ${rules}`);
  try {
    if (!Array.isArray(rules)) {
      throw new Error('Input must be an array of rules.');
    }


            logger.error(`[apply_rules]: ${rules}`);


    const results = [];
    for (const rule of rules) {
      try {
        const { rule_name, description, scope, language, rule_content, categories } = rule;
        logger.error(`[apply_rules]: ${rule}`);
        const result = await applyRule(rule_name, description, scope, language, rule_content, categories);
        results.push(result);
      } catch (error) {
        logger.error(`[apply_rules]: Error applying rule - ${error.message}`);
        results.push(`Error applying rule: ${error.message}`);
      }
    }

    return results.join('\\n');
  } catch (error) {
    logger.error(`[apply_rules]: Error applying rules - ${error.message}`);
    throw new Error(`Error applying rules: ${error.message}`);
  }
}

export default applyRules;