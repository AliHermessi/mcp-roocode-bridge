import logger from "../logger.js";
import fs from "fs";
import path from "path";
import os from "os";
import {
  saveRule
} from "../services/db.service.js";
import * as dotenv from "dotenv";
dotenv.config({
  quiet: true
});
const cwd = process.cwd();
const homeDir = process.env.WORKSPACE_PATH || os.homedir();
import deleteRule from './delete_rule.js';

async function applyRule(
  rule_name,
  description,
  scope,
  language,
  rule_content,
  categories
) {
  try {

    let baseDir;

    try {
      deleteRule(rule_name, scope, language);
    } catch (e) {
      console.log(`could not delete rule before add`);
    }

    // Determine base directory by scope
    if (scope === "global") {
      baseDir = path.join(homeDir, ".roo", "rules");
    } else if (scope === "workspace") {
      baseDir = path.join(cwd, ".roo", "rules");
    } else if (scope.startsWith("mode-")) {
      const modeName = scope.slice(5);
      baseDir = path.join(cwd, `.roo`, `rules-${modeName}`);
    } else {
      throw new Error(
        `Invalid scope '${scope}'. Use 'global', 'workspace', or 'mode-<name>'.`
      );
    }

    // If a specific language is given (not empty or "general"), create language subfolder
    const targetDir =
      language && language !== "general" ?
      path.join(baseDir, language) :
      baseDir;

    // Ensure directory exists
    fs.mkdirSync(targetDir, {
      recursive: true
    });

    // Write rule JSON file
    const ruleFilePath = path.join(targetDir, `${rule_name}.json`);
    const ruleData = {
      rule_name,
      description,
      language,
      scope,
      rule_content,
      categories,
    };

    fs.writeFileSync(ruleFilePath, JSON.stringify(ruleData, null, 2), "utf-8");

    const message = `Rule '${rule_name}' applied to ${scope}${
      language && language !== "general" ? `/${language}` : ""
    } at ${ruleFilePath}`;
    console.log("Rule applied:", message);
    return message;
  } catch (error) {
    logger.log(`[apply_rule]: Error applying rule - ${error.message}`, "error");
    throw new Error(`Error applying rule: ${error.message}`);
  }
}

export default applyRule;
