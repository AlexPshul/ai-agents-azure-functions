import { app } from '@azure/functions';
import { CopilotClient } from '@github/copilot-sdk';
import { TextEncoderStream } from 'stream/web';

app.setup({ enableHttpStream: true });

app.get('talk', {
  handler: async (req, context) => {
    const prompt = req.query.get('prompt');
    if (!prompt) return { status: 400, body: 'Please provide a prompt query parameter.' };

    const client = new CopilotClient({ env: { ...process.env, NODE_NO_WARNINGS: '1' } });
    const { readable, writable } = new TextEncoderStream();
    const writer = writable.getWriter();

    const session = await client.createSession({
      model: 'gpt-5.4-mini',
      provider: {
        type: 'openai',
        baseUrl: process.env.FOUNDRY_MODEL_URL || '',
        wireApi: 'responses',
        apiKey: process.env.FOUNDRY_API_KEY,
      },
      systemMessage: {
        mode: 'append',
        content:
          'You are a helpful assistant. Based on user prompts, try to see if there is something worth remembering and use the Notes MCP to store that information. You can also fetch existing notes to provide better answers to the user. Always try to use the Notes MCP to store and retrieve information, as that will provide the best experience for the user.',
      },
      streaming: true,
      mcpServers: {
        notes: {
          type: 'http',
          url: 'http://localhost:7071/runtime/webhooks/mcp',
          tools: ['*'],
        },
      },
      onPermissionRequest: () => ({ kind: 'approved' }),
    });

    const done = new Promise<void>((resolve, reject) => {
      session.on('assistant.message_delta', (event) => writer.write(event.data.deltaContent));
      session.on('assistant.message', () => writer.write('\n'));
      session.on('session.idle', () => resolve());
      session.on('session.error', (event) => {
        const error = new Error(event.data.message);
        writer.abort(error);
        reject(error);
      });
    });

    await session.send({ prompt });
    context.log('Prompt sent, waiting for response...');

    done.then(async () => {
      writer.close();
      await client.stop();
    });

    return { body: readable };
  },
});
