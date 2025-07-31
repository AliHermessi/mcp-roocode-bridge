import logger from '../logger.js';
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { getConversation, createConversation, updateConversation } from "../conversations/conversation_manager.js";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });
const errorLogPath = path.join(process.cwd(), "mcp-roocode-bridge", "error-logs.txt");

const ai_url = process.env.AI_URL || "http://localhost:4000/v1/chat/completions";
const ai_key = process.env.AI_KEY || "";
const convId = process.env.CONVERSATION_ID || "123";

async function analyzeCode(conversationId, fullfilepath) {
  try {
    console.log(`Analyzing code for file: ${fullfilepath}`);
    console.log(`Conversation ID: ${conversationId}`);

    const fileContent = await fs.readFile(fullfilepath, 'utf-8');
    
    const combinedMessage = `\`\`\`\n${fileContent}\n\`\`\``;

    let conversation = await getConversation(convId);
    let isNewConversation = false;
    if (!conversation) {
      conversation = await createConversation(convId, combinedMessage);
      isNewConversation = true;
    } else {
      conversation.messages.push({ role: 'user', content: combinedMessage });
    }

    const aiResponse = await fetch(ai_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ai_key}`,
      },
      body: JSON.stringify({ messages: conversation.messages }),
    });

    if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI service returned an error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", aiData);

    const result = aiData.choices[0].message.content;
    
    conversation.messages.push({ role: 'assistant', content: result });
    await updateConversation(conversation, conversationId);

    console.log("Successfully analyzed code. Result:", result);
    return result;

  } catch (error) {
    logger.log(`[analyze_code]: Error analyzing code - ${error.message}`, 'error');
    throw new Error(`Error analyzing code: ${error.message}`);
  }
}

export default analyzeCode;
