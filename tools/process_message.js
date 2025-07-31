import logger from "../logger.js";
import fetch from "node-fetch";
import {
  getConversation,
  createConversation,
  updateConversation,
  defaultConversationTemplate,
} from "../conversations/conversation_manager.js";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });

const errorLogPath = path.join(
  process.cwd(),
  "mcp-roocode-bridge",
  "error-logs.txt"
);

const apiKey = process.env.AI_KEY;
const model = process.env.MODEL;
const ai_url = process.env.AI_URL;
const defaultConversationId = process.env.CONVERSATION_ID;

  logger.log(`API Key: ${apiKey}`, 'info');
  logger.log(`Model: ${model}`, 'info');
  logger.log(`AI URL: ${ai_url}`, 'info');
  logger.log(`Default Conversation ID: ${defaultConversationId}`, 'info');


async function processMessage(conversationId, message) {
  try {
    const convId = conversationId || defaultConversationId;
    let conversation = await getConversation(convId);
    let isNewConversation = false;

    if (!conversation) {
      conversation = await createConversation(convId);
      isNewConversation = true;
        conversation.messages.push({ role: "user", content: message });

    } else {
      conversation.messages.push({ role: "user", content: message });
    }

    const aiResponse = await fetch(ai_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: conversation.messages,
      }),
    });

    const aiData = await aiResponse.json();
    if (!aiData.choices || aiData.choices.length === 0) {
      throw new Error("AI service returned an empty response.");
    }
    const result = aiData.choices[0].message.content;

    conversation.messages.push({ role: "assistant", content: result });
    if (isNewConversation) {
      conversation.model = defaultConversationTemplate.model;
    }
    await updateConversation(conversation, convId);

    return result;
  } catch (error) {
    logger.log(
      `[process_message]: Error processing message - ${error.message}`,
      "error"
    );
    throw new Error(`Error processing message: ${error.message}`);
  }
}

export default processMessage;
