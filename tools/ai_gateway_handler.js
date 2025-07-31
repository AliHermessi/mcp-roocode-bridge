import { ooAICall } from '../ai_gateway.js';
import  process_message  from './process_message.js';

const aiGatewayHandler = async (inputs) => {
  let message = '';

  for (const input of inputs) {
    const { action, ...params } = input;

    message += `Action: ${action}, Params: ${JSON.stringify(params)}`;

    try {
      const result = await ooAICall(input);
      message += `, Result: ${JSON.stringify(result)}`;
    } catch (error) {
      message += `, Error: ${error.message}`;
    }
  }

  const conversationId = process.env.CONVERSATION_ID || '123';
  const processMessageResult = await process_message({ conversation_id: conversationId, message: message });

  return processMessageResult;
};

export { aiGatewayHandler };