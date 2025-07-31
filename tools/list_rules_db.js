import { listRules } from '../services/db.service.js';
import logger from '../logger.js';

export default async function listRulesDB(level) {
  logger.info(`Listing rules with level: ${level}`);
  const rules = await listRules();
  logger.info(`Found ${rules.length} rules`);

  let formattedRules = rules.map(rule => {
    switch (level) {
      case '1':
        return {
          rule_name: rule.rule_name,
          description: rule.description
        };
      case '2':
        return {
          rule_name: rule.rule_name,
          description: rule.description,
          scope: rule.scope,
          language: rule.language
        };
      case '3':
        return {
          rule_name: rule.rule_name,
          description: rule.description,
          language: rule.language,
          scope: rule.scope,
          rule_content: rule.rule_content,
          categories: rule.categories
        };
      default:
        return {
          rule_name: rule.rule_name,
          description: rule.description,
          language: rule.language,
          scope: rule.scope,
          rule_content: rule.rule_content,
          categories: rule.categories,
        };
    }
  });

  return formattedRules;
}