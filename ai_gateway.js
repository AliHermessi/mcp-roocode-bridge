import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import processMessage from "./tools/process_message.js";
import logger from './logger.js';
dotenv.config();

const WORKSPACE_ROOT = process.env.WORKSPACE_PATH || process.cwd();

export async function ooAICall(input) {
  const convId = process.env.CONVERSATION_ID || '123';
  const {
    action,
    file_path,
    user_message,
    rules,
    language,
    scope,
    level,
  } = input;
  let result;
  let message = `Action: ${action}, Params: ${JSON.stringify({ file_path, user_message, rules, language, scope, level })}`;
  try {
    switch (action) {
      case "give_file":
        result = await giveFile(file_path);
        break;
      case "list_project_files":
        result = await listProjectFiles();
        break;
      case "list_rules":
        result = await listRules(scope, language);
        break;
      case "list_rules_db":
        result = await listRulesDB(level, scope, language);
        break;
      case "apply_rules":
        result = await applyRules(rules);
        break;
      case "delete_rules":
        result = await deleterules(rules);
        break;
      case "process_message":
        result = await handleConversationAI(user_message, convId);
        break;
      case "confirm_no_change":
        result = [
          {
            action: "confirm-no-change",
            reason: "Rules already match detected patterns and user intent",
          },
        ];
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

      message += `, Result: ${JSON.stringify(result)}`;
      const processMessageResult = await processMessage(convId, message);
      return processMessageResult;

  } catch (error) {
    message += `, Error: ${error.message}`;
    await processMessage(convId, message);
    logger.error(`[ooAICall]: Error processing action - ${error.message}`);
    return [{ action: "confirm-no-change", reason: `Error processing action: ${error.message}` }];
  }

}

async function giveFile(fileQuery) {

  const searchPath = path.isAbsolute(fileQuery)
    ? fileQuery
    : path.join(WORKSPACE_ROOT, fileQuery);

  if (fs.existsSync(searchPath) && fs.statSync(searchPath).isFile()) {
    return [compressFile(fs.readFileSync(searchPath, 'utf-8'))];
  }

  const files = await getAllFiles(WORKSPACE_ROOT);
  const match = files.find(f => f.endsWith(fileQuery) || path.basename(f) === fileQuery);

  if (match) {
    const content = fs.readFileSync(match, 'utf-8');
    return [compressFile(content)];
  }

  return [{ action: "confirm-no-change", reason: `File \"${fileQuery}\" not found.` }];
}

function compressFile(content) {
  return content
    .replace(/\s+/g, " ")
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // remove comments
    .trim();
}

// This function lists all files in the project directory and returns a structured representation
async function listProjectFiles() {
  const structure = buildDirectoryTree(WORKSPACE_ROOT);
  return [structure];
}


// This function builds a directory tree structure from the given directory
function buildDirectoryTree(dir, base = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const tree = {};

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      tree[entry.name] = buildDirectoryTree(fullPath, relativePath);
    } else {
      if (!tree["__files__"]) tree["__files__"] = [];
      tree["__files__"].push(entry.name);
    }
  }

  return tree;
}

// This function lists rules from the filesystem based on the provided scope and language
//scope and language are optional parameters to filter the rules
async function listRules(scope, language) {
  const listRulesRaw = (await import("./tools/list_rules.js")).default;
  const rulesJson = await listRulesRaw();
  const rules = JSON.parse(rulesJson); // <-- parse it first

  logger.info(`[listRules]: Found ${rules}`);


  if (!scope && !language) return rules;
  
  const filtered = [];

  for (const rule of rules) {
    if (scope && rule.scope !== scope) continue;
    if (language && (!rule.language || !rule.language.includes(language)))
      continue;
    filtered.push(rule);
  }

  return filtered;
}

// This function lists rules from the database based on the provided level, scope, and language
// It expects a level parameter to filter the rules accordingly
async function listRulesDB(level, scope, language) {
  const listRulesDB = (await import("./tools/list_rules_db.js")).default;
  const rules = await listRulesDB(level);

  if (!scope && !language) return rules;

  const filtered = [];

  for (const rule of rules) {
    if (scope && rule.scope !== scope) continue;
    if (language && !rule.language.includes(language)) continue;
    filtered.push(rule);
  }

  return filtered;
}

// Applies the provided rules to the current project
// This function expects an array of rule objects
async function applyRules(rules) {
  const  applyRules  = (await import("./tools/apply_rules.js")).default;
  await applyRules(rules);
  return [{ action: "update", reason: "Applied rule(s) successfully." }];
}


// Deletes rules based on the provided rule names
// This function expects an array of rule objects with a 'rule_name' property
async function deleterules(rules) {
  const deleteRuleByName = (await import("./tools/delete_rule.js")).default;
  const deleted = [];

  for (const rule of rules) {
    await deleteRuleByName(rule.rule_name);
    deleted.push(rule.rule_name);
  }

  return [{ action: "delete", reason: `Deleted rules: ${deleted.join(', ')}` }];
}

// This function retrieves all files in a directory recursively
// It returns a flat array of file paths
async function getAllFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getAllFiles(res) : res;
    })
  );
  return files.flat();
}

// This function processes a conversation message and returns the result
async function handleConversationAI(
  content,
  conversationId = convId
) {
  return await processMessage(conversationId, content);
}