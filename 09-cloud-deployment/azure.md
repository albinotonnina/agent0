# Deploying AI Agents on Microsoft Azure

This guide explains how to deploy production-grade AI agents on Microsoft Azure.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Azure Agent Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │ API Mgmt │────▶│ Azure Func   │────▶│  Azure OpenAI Service    │ │
│  │ / Front  │     │ or Container │     │  (GPT-4o / Claude*)      │ │
│  │   Door   │     │    Apps      │     └──────────────────────────┘ │
│  └──────────┘     └──────────────┘                                   │
│                          │                                           │
│                          ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    State & Memory Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ Cosmos DB  │  │ Redis      │  │ Azure AI Search        │  │   │
│  │  │ (State)    │  │ (Cache)    │  │ (Vector Store / RAG)   │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

* Claude available via Azure AI Model Catalog (Preview)
```

---

## 1. Compute Options

| Service | Best For | Cold Start | Cost Model |
|---------|----------|------------|------------|
| **Azure Functions** | Short, event-driven workloads | Yes (can be avoided with Premium) | Per-execution |
| **Container Apps** | Long-running agents, auto-scaling | No | Per-second |
| **AKS (Kubernetes)** | Complex multi-agent systems | No | Per-node |
| **Logic Apps** | Low-code workflow orchestration | N/A | Per-action |

### Recommendation
- **Simple Agents**: Azure Functions (Premium for no cold start)
- **LangGraph Agents**: Container Apps (handles long-running processes)
- **Enterprise Integration**: Logic Apps + Functions hybrid

---

## 2. Model Hosting

### Option A: Azure OpenAI Service (Managed)
Microsoft's managed deployment of OpenAI models (GPT-4o, GPT-4 Turbo).

```javascript
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2024-02-01",
  endpoint: "https://YOUR-RESOURCE.openai.azure.com",
});

const response = await client.chat.completions.create({
  model: "gpt-4o", // Your deployment name
  messages: [{ role: "user", content: "Hello" }],
});
```

**Pros**: Enterprise SLAs, data stays in your Azure tenant, content filtering built-in.
**Cons**: Slightly behind OpenAI on latest features.

### Option B: Azure AI Model Catalog
Access to Claude, Llama, Mistral, and more via a unified API.

### Option C: External API (Anthropic Direct)
Store `ANTHROPIC_API_KEY` in Azure Key Vault.

```javascript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const client = new SecretClient(
  "https://YOUR-VAULT.vault.azure.net",
  new DefaultAzureCredential()
);
const secret = await client.getSecret("anthropic-api-key");
```

---

## 3. State Persistence (LangGraph)

### Cosmos DB Checkpointer
Cosmos DB is ideal for global distribution and low latency.

```javascript
import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

// Custom checkpointer implementation
class CosmosDBCheckpointer {
  constructor(container) {
    this.container = container;
  }
  
  async get(threadId) {
    const { resource } = await this.container.item(threadId, threadId).read();
    return resource?.state;
  }
  
  async put(threadId, state) {
    await this.container.items.upsert({ id: threadId, state });
  }
}
```

### Partition Strategy
Use `thread_id` as partition key for even distribution.

---

## 4. RAG / Vector Store

### Option A: Azure AI Search (Recommended)
Formerly Azure Cognitive Search. Hybrid search (keyword + vector).

```javascript
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

const searchClient = new SearchClient(
  "https://YOUR-SEARCH.search.windows.net",
  "knowledge-index",
  new AzureKeyCredential(process.env.SEARCH_API_KEY)
);

const results = await searchClient.search("rate limit policy", {
  vectorQueries: [{
    kind: "vector",
    vector: await getEmbedding("rate limit policy"),
    fields: ["contentVector"],
    kNearestNeighborsCount: 5,
  }],
});
```

### Option B: Azure OpenAI "On Your Data"
Upload files directly to Azure OpenAI and query them. Zero-code RAG.

---

## 5. Observability

| Need | Azure Service |
|------|---------------|
| Logs | Azure Monitor Logs (Log Analytics) |
| Traces | Application Insights |
| Metrics | Azure Monitor Metrics |
| Alerts | Azure Alerts -> Action Groups |

### Application Insights Integration
```javascript
import { useAzureMonitor } from "@azure/monitor-opentelemetry";

useAzureMonitor({
  azureMonitorExporterOptions: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
});
```

### LangSmith (External)
Works alongside Azure Monitor for LLM-specific tracing.

---

## 6. Event Sources (Triggers)

| Trigger Type | Azure Service |
|--------------|---------------|
| HTTP Request | API Management, Front Door |
| Schedule (Cron) | Timer Trigger (Functions), Logic Apps |
| Queue | Azure Service Bus, Storage Queues |
| Stream | Event Hubs, Event Grid |
| Webhook (External) | HTTP Trigger -> Function |

---

## 7. Security Best Practices

1. **Managed Identity**: Use Managed Identity instead of API keys wherever possible.
2. **Key Vault**: Store all secrets in Azure Key Vault.
3. **Private Endpoints**: Connect to Cosmos DB, OpenAI via Private Link.
4. **Content Safety**: Use Azure AI Content Safety to filter inputs/outputs.
5. **RBAC**: Use Azure RBAC for fine-grained access control.

---

## 8. Azure-Specific Features

### Responsible AI
Azure OpenAI includes built-in content filtering. Configure levels:
- **Off** (for approved use cases)
- **Low / Medium / High** harm thresholds

### Semantic Kernel (Microsoft SDK)
Microsoft's official AI orchestration SDK (similar to LangChain).

```javascript
import { Kernel } from "@microsoft/semantic-kernel";

const kernel = new Kernel();
kernel.addPlugin(myPlugin);
const result = await kernel.invoke("chat", { input: "Hello" });
```

---

## Example: Deploying with Azure Container Apps

```bash
# Deploy a LangGraph agent
az containerapp create \
  --name my-agent \
  --resource-group my-rg \
  --environment my-env \
  --image myregistry.azurecr.io/agent:latest \
  --target-port 3000 \
  --ingress external \
  --secrets anthropic-key=secretref:anthropic-api-key \
  --env-vars ANTHROPIC_API_KEY=secretref:anthropic-key
```

---

## Cost Optimization

- Use **Azure Reservations** for Cosmos DB and Azure OpenAI.
- Use **Consumption Tier** for Container Apps (scale to zero).
- Enable **Prompt Caching** (Azure OpenAI) for repeated system prompts.
