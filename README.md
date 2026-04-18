# AI Agents on Azure Functions
A practical example of how to create your own AI agent and connect it to an MCP server using Azure Functions for NodeJS.

Setup:
- Monorepo setup by [NX](https://nx.dev/)
- [@nxazure/func](https://github.com/AlexPshul/nxazure/tree/master/packages/func) plugin for NX
- [Copilot SDK](https://github.com/github/copilot-sdk/tree/main/nodejs)
- Azure Functions [MCP Triggers](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-mcp?pivots=programming-language-typescript)
- [Azurite](https://github.com/azure/azurite) for running your function apps locally
- [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer) (for local running)

## To run the demo,  
1. Clone the repo
2. `npm install`
3. Setup your AI model. Choose one of the options below:
    1. Setup in [local.settings.json](./apps/agent/local.settings.json) the model URL and the API Key from your Microsoft Foundry. If you are not using GPT 5.4 mini, also update the model in the [talk endpoint](./apps/agent/src/functions.talk.ts).
    2. Use another [GitHub Copilot SDK BYOK](https://github.com/github/copilot-sdk#does-it-support-byok-bring-your-own-key) method.
    3. To run locally, you can just use your GitHub Copilot CLI authentication, but it won't work if you will try to deploy the function apps
4. Run azurite
5. Create a table called `notes`
    1. Azure Storage Explorer will help you here
7. Run both functions locally  
   ```bash
   npx nx run-many --target=start --parallel=2
   ```
   
## Deploy to cloud

1. Create function apps on Azure for notes mcp and agent (1 for each).
2. For the agent function app, update the environment variables.
    1. The AI model related keys.
    2. The URL of the cloud function app for the notes mcp.
3. Make sure you create a table called notes in the storage account
    1. You can do it online by going directly to the cloud
    2. Or you can connect your Azure Storage Explorer to your Azure account
4. Publish the notes MCP function app
   ```bash
   npx nx publish notes-mcp -n <YOUR_NOTES_MCP_FUNCTION_APP_NAME_ON_AZURE>
   ```
5. Publish the agent function app
   ```bash
   npx nx publish agent -n <YOUR_AGENT_FUNCTION_APP_NAME_ON_AZURE>
   ```
6. You can read more about the publish commands on [@nxazure/func README](https://github.com/AlexPshul/nxazure/tree/master/packages/func#publish-to-azure).
