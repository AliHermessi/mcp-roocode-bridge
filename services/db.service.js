import logger  from '../logger.js';

logger.info('db.service.js loaded');
import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mcp_rules",
  password: "system",
  port: 5432,
});

export async function saveRule({
  rule_name,
  description,
  language,
  scope,
  rule_content,
  categories,
}) {
  logger.info(`Saving rule: ${rule_name}`);

  

  await pool.query(
    "INSERT INTO rules (rule_name, description, language, scope, rule_content, categories) VALUES ($1, $2, $3, $4, $5, $6)",
    [rule_name,description, language, scope, rule_content, categories]
  );
  logger.info(`Rule saved: ${rule_name}`);
}

export async function listRules() {
  logger.info('Listing rules');
  const res = await pool.query("SELECT * FROM rules");
  logger.info(`Found ${res.rows.length} rules`);
  return res.rows;
}

export async function getRuleById(ruleId) {
  logger.info(`Getting rule by id: ${ruleId}`);
  const res = await pool.query("SELECT * FROM rules WHERE id = $1", [ruleId]);
  logger.info(`Found rule: ${res.rows[0]?.rule_name}`);
  return res.rows[0];
}

export async function updateRule(ruleId, updates) {
    logger.info(`Updating rule: ${ruleId}`);
    const { rule_name, description, language, scope, rule_content, categories } = updates;
    const query = `
        UPDATE rules
        SET
        rule_name = COALESCE($1, rule_name),
        description = COALESCE($2, description),
        language = COALESCE($3, language),
        scope = COALESCE($4, scope),
        rule_content = COALESCE($5, rule_content),
        categories = COALESCE($6, categories)
        WHERE id = $7
    `;
    await pool.query(query, [
        rule_name,
        description,
        language,
        scope,
        rule_content,
        categories,
        ruleId
    ]);
    logger.info(`Rule updated: ${ruleId}`);
    }

export async function deleteRuleByID(ruleId) {
  logger.info(`Deleting rule: ${ruleId}`);
  await pool.query("DELETE FROM rules WHERE id = $1", [ruleId]);
  logger.info(`Rule deleted: ${ruleId}`);
}

export async function deleteRuleByName(ruleName) {
  logger.info(`Deleting rule by name: ${ruleName}`);
  await pool.query("DELETE FROM rules WHERE rule_name = $1", [ruleName]);
  logger.info(`Rule deleted: ${ruleName}`);
}