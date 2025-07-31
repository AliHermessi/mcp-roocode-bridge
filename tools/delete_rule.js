import fs from "fs/promises";
import path from "path";
import os from "os";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });

const cwd = process.cwd();
const homeDir = process.env.WORKSPACE_PATH || os.homedir();
const errorLogPath = path.join(cwd, "mcp-roocode-bridge", "error-logs.txt");

async function findRuleFiles(baseDir, language) {
  const results = [];
  const dirToSearch =
    language && language !== "general" ? path.join(baseDir, language) : baseDir;

  try {
    const entries = await fs.readdir(dirToSearch, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (![".json", ".txt", ".md"].includes(ext)) continue;

      const fullPath = path.join(dirToSearch, entry.name);
      try {
        const content = await fs.readFile(fullPath, "utf8");
        const rule = JSON.parse(content);
        if (rule?.rule_name) {
          results.push({
            rule_name: rule.rule_name,
            path: fullPath,
            file: entry.name,
          });
        }
      } catch (err) {
        // skip files that are not valid JSON
      }
    }
  } catch (err) {
    // no-op if folder doesn't exist
  }

  return results;
}

/**
 * Deletes a RooCode rule by rule_name.
 * Searches all relevant folders (global, workspace, mode-*).
 * @param {string} ruleName
 * @param {string} [language="general"]
 * @returns {string} Success or failure message
 */
async function deleteRuleByName(ruleName, language = "general") {
  const timestamp = new Date().toISOString();
  const searchScopes = [
    { scope: "workspace", dir: path.join(cwd, ".roo", "rules") },
    { scope: "global", dir: path.join(homeDir, ".roo", "rules") },
  ];

  // Add mode-specific folders
  try {
    const modePath = path.join(cwd, ".roo", "custom_modes.json");
    const modeContent = await fs.readFile(modePath, "utf8");
    const modes = Object.keys(JSON.parse(modeContent));

    for (const mode of modes) {
      searchScopes.push({
        scope: `mode-${mode}`,
        dir: path.join(cwd, `.roo`, `rules-${mode}`),
      });
      searchScopes.push({
        scope: `global-mode-${mode}`,
        dir: path.join(homeDir, `.roo`, `rules-${mode}`),
      });
    }
  } catch (e) {
    // custom_modes.json might not exist
  }

  for (const { scope, dir } of searchScopes) {
    const files = await findRuleFiles(dir, language);
    const match = files.find((r) => r.rule_name === ruleName);
    if (match) {
      try {
        await fs.unlink(match.path);
        return `✅ Deleted rule '${ruleName}' from ${scope}${
          language !== "general" ? `/${language}` : ""
        }`;
      } catch (e) {
        const logMessage = `[${timestamp}][delete_rule]: Failed to delete '${match.path}' - ${e.message}\n`;
        console.error(logMessage);
        await fs.appendFile(errorLogPath, logMessage);
        throw new Error(`❌ Error deleting rule '${ruleName}': ${e.message}`);
      }
    }
  }

  return `❌ Rule '${ruleName}' not found in any scope`;
}

export default deleteRuleByName;
