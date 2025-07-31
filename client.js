require('./index.js');

import {
  Client
} from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport
} from '@modelcontextprotocol/sdk/client/stdio.js';
import './index.js';

import {
  select,
  input
} from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';

import ora from "ora";
import chalk from "chalk";
import os from "os";

import listRulesDB from "./tools/list_rules_db.js";
import applyRules from "./tools/apply_rules.js";
import logger from "./logger.js";

import * as dotenv from "dotenv";
dotenv.config({
  quiet: true
});

const mcp = new Client({
  name: "roocode-mcp-client",
  version: "1.0.0",
}, {
  capabilities: {
    sampling: {

    }
  }
});

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"], // Pointing to the main server file
  stderr: "ignore",
});

async function main() {
  await mcp.connect(transport);
  const [{
    tools
  }] = await Promise.all([
    mcp.listTools(),
  ]);


  console.log("You are connected to the MCP server!");

  // Check if project path is set in environment variables

  let projectPath = "";
  if (process.env.WORKSPACE_PATH) {
    console.log(`Current project path is set to: ${process.env.WORKSPACE_PATH}`);
    const confirm = await select({
      message: "Is this the correct project path?",
      choices: ["Yes", "No"],
    });
    if (confirm === "Yes") {
      projectPath = process.env.WORKSPACE_PATH;
    }
    if (confirm === "No") {
      console.log("Please enter a new project path.");
      handleProjectPath();
      console.clear();
    }
  }

  // Check if conversation ID is set in environment variables

  if (process.env.CONVERSATION_ID) {
    console.log(
      `Current conversation is set to: ${process.env.CONVERSATION_ID}`
    );
    const confirm = await select({
      message: "Is this the correct conversation you want to continue with ?",
      choices: ["Yes", "No"],
    });
    if (confirm === "Yes") {
      console.log("Continuing with the current conversation.");

    }
    if (confirm === "No") {
      console.log("Please choose a new Conversation.");
      handleConversationId();
      console.clear();
    }
  }

// Ask user if they want to load default rules

  const loadDefaults = await select({
    message: "Do you want to apply default rules to this project?",
    choices: ["Yes", "No"],
  });

  if (loadDefaults === "Yes") {
    await loading_default_rules();
    console.clear();
  }else{
    console.clear();
  }

// Add MCP bridge to global settings
  addGlobalMCPBridge(); 


  while (true) {
    const option = await select({
      message: "What would you like to do?",
      choices: ["set project path", "set conversation","Tools", "Exit"],
    });

    switch (option) {
      case "set project path":
        await handleProjectPath();
        break;
      case "set conversation":
        await handleConversationId();
        break;
      case "Tools":
        const toolName = await select({
          message: "Select a tool",
          choices: tools.map(tool => ({
            name: tool.annotations?.title || tool.name,
            value: tool.name,
            description: tool.description,
          })),
        });
        const tool = tools.find(t => t.name === toolName);
        if (tool == null) {
          console.error("Tool not found.");
        } else {
          await handleTool(tool);
        }
        break;
      case "Exit":
        console.log("Exiting client.");
        await mcp.disconnect();
        process.exit(0);
    }
  }
}

async function handleTool(tool) {
  const args = {};
  for (const [key, value] of Object.entries(
      tool.inputSchema.properties || {}
    )) {
    args[key] = await input({
      message: `Enter value for ${key} (${value.type}):`,
    });
  }

  try {
    const res = await mcp.callTool({
      name: tool.name,
      arguments: args,
    });
    console.log("Tool result:", JSON.stringify(res, null, 2));
  } catch (error) {
    console.error(`Error calling tool '${tool.name}':`, error);
  }
}


async function handleProjectPath() {

  while (projectPath === "") {
    console.clear();
    projectPath = await input({
      message: "Enter the project path:",
      validate: (input) => {

        if (input.trim() === "") {
          return false;
        }

        if (fs.existsSync(input)) {
          projectPath = input;
          return true;
        } else {
          projectPath = "";
          return false;
        }
        return false;
      },
    });
  }

  process.env.WORKSPACE_PATH = projectPath;
  console.log(`Project path set to: ${process.env.WORKSPACE_PATH}`);

}

async function handleConversationId() {
  const dbPath = path.join(process.cwd(), "conversations", "db");

  let choices = [];
  let existingIds = [];
  try {
    const files = fs.readdirSync(dbPath).filter((f) => f.endsWith(".json"));

    existingIds = files.map((f) => f.replace(".json", ""));

    choices = files.map((f) => {
      const filePath = path.join(dbPath, f);
      const stat = fs.statSync(filePath);
      return {
        name: `${f.replace(
          ".json",
          ""
        )} (Last modified: ${stat.mtime.toLocaleString()})`,
        value: f.replace(".json", ""),
      };
    });
  } catch (err) {
    console.warn("⚠️ Could not read conversations directory.");
  }

  const action = await select({
    message: "Choose a conversation ID:",
    choices: [
      ...choices,
      {
        name: "➕ Create new conversation",
        value: "create"
      },
    ],
  });

  if (action === "create") {
    let newId = "";
    while (true) {
      newId = await input({
        message: "Enter new conversation ID:",
        validate: (val) => {
          const trimmed = val.trim();
          if (trimmed === "") return "ID cannot be empty";
          if (existingIds.includes(trimmed))
            return "ID already exists. Please choose a different one.";
          return true;
        },
      });

      if (!existingIds.includes(newId.trim())) break;
    }

    const newPath = path.join(dbPath, `${newId}.json`);
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, {
      recursive: true
    });
    fs.writeFileSync(newPath, JSON.stringify({
      messages: []
    }, null, 2));

    process.env.CONVERSATION_ID = newId.trim();
    console.log(`🆕 Created and selected conversation: ${newId}`);
  } else {
    process.env.CONVERSATION_ID = action;
    console.log(`📌 Selected existing conversation: ${action}`);
  }
}

async function loading_default_rules() {
  const spinner = ora('🔄 Loading and applying default rules...').start();

  try {
    const allRules = await listRulesDB("3");

    const defaultRules = allRules.filter(rule =>
      Array.isArray(rule.categories) &&
      rule.categories.includes("default")
    );

    spinner.text = `Applying ${defaultRules.length} default rule(s)...`;

    if (defaultRules.length === 0) {
      spinner.succeed("✅ Default rules applied successfully.");
      return [];
    }

    const result = await applyRules(defaultRules);
    spinner.succeed('✅ Default rules applied successfully.');
    return result;
  } catch (error) {
    spinner.fail(`❌ Failed to apply default rules: ${error.message}`);
    logger.error(`[loading_default_rules]: Failed - ${error.message}`);
    throw error;
  }
}

async function addGlobalMCPBridge() {
  try {
    console.log(chalk.yellow("⚙️  Setting up MCP bridge..."));

    // Resolve path to mcp-roocode-bridge/index.js (assumes it's next to this script)
    const baseDir = path.resolve(process.cwd(), "mcp-roocode-bridge");
    const indexPath = path.join(baseDir, "index.js");

    // Path to global MCP settings
    const settingsPath = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "Code",
      "User",
      "globalStorage",
      "rooveterinaryinc.roo-cline",
      "settings",
      "mcp_settings.json"
    );

    // Load or initialize settings
    let settings = {};
    try {
      const data = await fs.readFile(settingsPath, "utf8");
      settings = JSON.parse(data);
    } catch {
      settings = {};
    }

    if (!settings.mcpServers) settings.mcpServers = {};

    const alreadyExists =
      settings.mcpServers["mcp-roocode-bridge"] !== undefined;

    // Add/replace MCP entry
    settings.mcpServers["mcp-roocode-bridge"] = {
      command: "node",
      args: [indexPath],
      env: {},
      timeout: 900,
      alwaysAllow: ["ai_gateway", "ai_gateway_handler", "process_message"],
    };

    // Save updated settings
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");

    if (alreadyExists) {
      console.log(chalk.green("🔁 MCP bridge replaced successfully."));
    } else {
      console.log(chalk.green("✅ MCP bridge added successfully."));
      
    }
  } catch (err) {
    console.error(chalk.red("❌ Failed to update MCP settings:"), err);
  }
}


main();


// Instructions for console use:
// 1. Open your terminal in the 'mcp-roocode-bridge' directory.
// 2. Run `node client.js`
// 3. Follow the prompts in the console.