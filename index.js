import logger from './logger.js';
logger.info("MCP Roocode Bridge server is starting...");

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import applyRule from "./tools/apply_rule.js";
import fetch from "node-fetch";

import processMessage from "./tools/process_message.js";
import analyzeCode from "./tools/analyze_code.js";
import analyzeFile from "./tools/analyze_file.js";
import listRules from "./tools/list_rules.js";
import deleteRule from "./tools/delete_rule.js";
import applyRules from "./tools/apply_rules.js";
import listRulesDB from './tools/list_rules_db.js';

import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });

const errorLogPath = path.join(process.cwd(), "error-logs.txt");
console.log(`Error log path: ${errorLogPath}`);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const server = new McpServer({
  name: "mcp-roocode-bridge",
  version: "1.0.0",
});

server.tool(
  "apply_rule",
  {
    rule_name: z.string(),
    description: z.string(),
    scope: z.string(),
    language: z.string(),
    rule_content: z.object({}).passthrough(),
    categories: z.array(z.string()).optional(),
  },
  async ({ rule_name, description, scope, language, rule_content, categories }) => {
    try {
      const result = await applyRule(rule_name, description, scope, language, rule_content, categories);
      logger.info(`[apply_rule]: Rule applied successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[apply_rule]: Error applying rule - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error applying rule: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "process_message",
  {
    conversation_id: z.string(),
    message: z.string(),
  },
  async ({ conversation_id, message }) => {
    try {
      const result = await processMessage(conversation_id, message);
      logger.info(`[process_message]: Message processed successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[process_message]: Error processing message (conversation_id: ${conversation_id}) - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error processing message: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "analyze_code",
  {
    conversation_id: z.string(),
    fullfilepath: z.string(),
  },
  async ({ conversation_id, fullfilepath }) => {
    try {
      const result = await analyzeCode(conversation_id, fullfilepath);
      logger.info(`[analyze_code]: Code analyzed successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[analyze_code]: Error analyzing code (conversation_id: ${conversation_id}) - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error analyzing code: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_rules",
  {},
  async () => {
    try {
      const result = await listRules();
      logger.info(
        `[list_rules]: Rules listed successfully: ${JSON.stringify(result)}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      logger.error(`[list_rules]: Error listing rules - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error listing rules: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "apply_rules",
  {
    rules: z.array(
      z.object({
        rule_name: z.string(),
        description: z.string(),
        scope: z.string(),
        language: z.string(),
        rule_content: z.object({}).passthrough(),
        categories: z.array(z.string()).optional(),
      })
    ),
  },
  async ({ rules }) => {
    try {
      const result = await applyRules(rules);
      logger.info(`[apply_rules]: Rules applied successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[apply_rules]: Error applying rules - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error applying rules: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete_rule",
  {
    ruleFile: z.string(),
    scope: z.string(),
  },
  async ({ ruleFile, scope }) => {
    try {
      const result = deleteRule(ruleFile, scope);
      logger.info(`[delete_rule]: Rule deleted successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[delete_rule]: Error deleting rule - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error deleting rule: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);


server.tool(
  "analyze_file",
  {
    fullfilepath: z.string(),
  },
  async ({ fullfilepath }) => {
    try {
      logger.info(`[analyze_file]: fullfilepath: ${fullfilepath}`);
      const result = await analyzeFile(fullfilepath);
      logger.info(`[analyze_file]: File analyzed successfully: ${result}`);
      return {
        content: [ { type: "text", text: result } ]
      };
    } catch (error) {
      logger.error(`[analyze_file]: Error analyzing file - ${error.message} , file path : ${fullfilepath}`);
      return {
        content: [
          { type: "text", text: `Error analyzing file: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "ai_gateway_handler",
  {
    inputs: z.array(z.object({
      action: z.string(),
      file_path: z.string().optional(),
      file_content: z.string().optional(),
      user_message: z.string().optional(),
      rules: z.array(z.object({}).passthrough()).optional(),
      language: z.string().optional(),
      scope: z.string().optional(),
      project_meta: z.object({}).passthrough().optional(),
      additional_context: z.object({}).passthrough().optional(),
    })),
  },
  async ({ inputs }) => {
    try {
      logger.info(`[ai_gateway_handler]: Processing multiple inputs`);
      const { aiGatewayHandler } = await import('./tools/ai_gateway_handler.js');
      const result = await aiGatewayHandler(inputs);
      logger.info(`[ai_gateway_handler]: Inputs processed successfully: ${result}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      logger.error(`[ai_gateway_handler]: Error processing inputs - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error processing inputs: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "ai_gateway",
  {
    action: z.string(),
    file_path: z.string().optional(),
    user_message: z.string().optional(),
    rules: z.array(z.object({}).passthrough()).optional(),
    language: z.string().optional(),
    scope: z.string().optional(),
    level: z.number().optional(),
  },
  async ({ action, file_path, user_message, rules, language, scope, level }) => {
    try {
      logger.info(`[ai_gateway]: Action: ${action}`);
      const { ooAICall } = await import('./ai_gateway.js');
      const result = await ooAICall({ action, file_path, user_message, rules, language, scope, level });
      logger.info(`[ai_gateway]: Action processed successfully: ${result}`);
      return {
        content:  [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      logger.error(`[ai_gateway]: Error processing action - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error processing action: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_rules_db",
  {
    level: z.string().optional().default("3"),
  },
  async ({ level = "3" }) => {
    try {
      const result = await listRulesDB(String(level));
      logger.info(`[list_rules_db]: Rules listed successfully with level ${level}: ${result}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      logger.error(`[list_rules_db]: Error listing rules with level ${level} - ${error.message}`);
      return {
        content: [
          { type: "text", text: `Error listing rules with level ${level}: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
logger.info("MCP Roocode Bridge server running on stdio");

process.on('exit', (code) => {
  logger.info(`MCP Roocode Bridge server is closing with code ${code}`);
});

process.on('SIGINT', () => {
  logger.info('MCP Roocode Bridge server is closing due to SIGINT');
  process.exit(0);
});
