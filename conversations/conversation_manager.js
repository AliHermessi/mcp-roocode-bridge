import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ai_context_message } from '../tools/ai_analyze.js';
const modelName = process.env.MODEL_NAME || 'google-vertex/gemini-2.0-flash-thinking-exp-01-21';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

const conversationsDir = path.resolve(currentDir, 'db');

try {
  await fs.access(conversationsDir);
} catch {
  await fs.mkdir(conversationsDir, { recursive: true });
}

const defaultConversationTemplate = {
  model: modelName,
  messages: [
    {
      role: "system",
      content: `
      ${ai_context_message} \\n
      DON'T REPLY TO THIS CONTEXT MESSAGE.
      `,
    },
    {
      role: "user",
      content:
        "DONT WRITE NORMAL TEXT,ONLY TALK IN FUNCTION CALLS(MENTION ai_gateway or ai_gateway_handler AS WE SAID IN EARLIER MESSAGE , ONLY MCP FUNCTION CALLS.\n\n\n\n\n",
    },
    {
      role: "user",
      content:
        "IF YOU DONT MENTION ai_gateway or ai_gateway_handler IN YOUR RESPONSE I WILL ASSUME YOU ARE TALKING NORMALLY AND I WILL IGNORE YOUR RESPONSE!!!",
    },
    {
      role: "assistant",
      content:
        "I will only respond with function calls, no normal text or commentary.",
    },
  ],
  temperature: 0,
  stream: false,
};

async function getConversation(conversationId) {
  const dbDir = path.resolve(currentDir, 'db');
  const conversationFile = path.join(dbDir, `${conversationId}.json`);

  try {
    await fs.access(conversationFile);
    const data = await fs.readFile(conversationFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function createConversation(conversationId) {
  const dbDir = path.resolve(currentDir, 'db');
  const conversationFile = path.join(dbDir, `${conversationId}.json`);

  const newConversation = {
    ...defaultConversationTemplate,
    messages: [...defaultConversationTemplate.messages]
  };

  try {
    await fs.writeFile(conversationFile, JSON.stringify(newConversation, null, 2));
    console.log("Conversation file created: " + conversationFile);
  } catch (error) {
    console.error("Error creating conversation file: " + error);
  }
  return newConversation;
}

async function updateConversation(conversation, conversationId) {
  const dbDir = path.resolve(currentDir, 'db');
  const conversationFile = path.join(dbDir, `${conversationId}.json`);

  await fs.writeFile(conversationFile, JSON.stringify(conversation, null, 2));
  return conversation;
}

export { getConversation, createConversation, updateConversation ,defaultConversationTemplate };
