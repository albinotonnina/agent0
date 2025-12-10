# Deploying AI Agents on Google Cloud Platform

This guide explains how to deploy production-grade AI agents on GCP.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GCP Agent Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │ Cloud    │────▶│ Cloud Run    │────▶│  Vertex AI / Claude API  │ │
│  │ Endpoints│     │ or GKE       │     │  (Model Garden)          │ │
│  └──────────┘     └──────────────┘     └──────────────────────────┘ │
│                          │                                           │
│                          ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    State & Memory Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ Firestore  │  │ Memorystore│  │ Vertex AI Vector Search│  │   │
│  │  │ (State)    │  │ (Cache)    │  │ (RAG)                  │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Compute Options

| Service | Best For | Cold Start | Cost Model |
|---------|----------|------------|------------|
| **Cloud Functions (2nd Gen)** | Short, event-driven workloads | Minimal | Per-invocation |
| **Cloud Run** | Stateless HTTP agents, auto-scaling | Minimal | Per-request-second |
| **GKE Autopilot** | Complex multi-agent systems | No | Per-pod |
| **Workflows** | Orchestrating multi-step processes | N/A | Per-step |

### Recommendation
- **Simple Agents**: Cloud Run (excellent cold start, generous free tier)
- **LangGraph Agents**: Cloud Run with min instances = 1
- **Complex Orchestration**: Workflows + Cloud Run

---

## 2. Model Hosting

### Option A: Vertex AI (Model Garden)
GCP's managed AI platform. Access to Claude, Gemini, Llama, and more.

```javascript
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "my-project-id",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const result = await model.generateContent("Hello, world!");
```

### Option B: Claude on Vertex AI
Anthropic's Claude is available through Model Garden.

```javascript
import Anthropic from "@anthropic-ai/sdk";

// Uses Application Default Credentials (ADC)
const client = new Anthropic({
  // No API key needed - uses GCP auth
});

// When running on GCP, set:
// CLOUD_ML_REGION=us-central1
// ANTHROPIC_VERTEX_PROJECT_ID=my-project
```

### Option C: External API (Anthropic Direct)
Store `ANTHROPIC_API_KEY` in Secret Manager.

```javascript
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: "projects/my-project/secrets/anthropic-key/versions/latest",
});
const apiKey = version.payload.data.toString();
```

---

## 3. State Persistence (LangGraph)

### Firestore Checkpointer
Firestore is serverless, scales automatically, and has great Node.js support.

```javascript
import { Firestore } from "@google-cloud/firestore";

const db = new Firestore();

class FirestoreCheckpointer {
  constructor(collection = "agent-state") {
    this.collection = db.collection(collection);
  }
  
  async get(threadId) {
    const doc = await this.collection.doc(threadId).get();
    return doc.exists ? doc.data().state : null;
  }
  
  async put(threadId, state) {
    await this.collection.doc(threadId).set({ 
      state, 
      updatedAt: Firestore.FieldValue.serverTimestamp() 
    });
  }
}
```

### Collection Structure
```
agent-state/
  {thread_id}/
    state: { ... }
    updatedAt: Timestamp
```

---

## 4. RAG / Vector Store

### Option A: Vertex AI Vector Search (Recommended)
Formerly Matching Engine. Highly scalable, low latency.

```javascript
import { MatchServiceClient } from "@google-cloud/aiplatform";

const client = new MatchServiceClient();
const [response] = await client.findNeighbors({
  indexEndpoint: "projects/.../indexEndpoints/...",
  deployedIndexId: "my-index",
  queries: [{
    datapoint: { featureVector: embedding },
    neighborCount: 5,
  }],
});
```

### Option B: AlloyDB with pgvector
PostgreSQL-compatible with vector extensions.

### Option C: Vertex AI Search (Managed RAG)
Upload documents and query. Zero-code option.

---

## 5. Observability

| Need | GCP Service |
|------|-------------|
| Logs | Cloud Logging |
| Traces | Cloud Trace |
| Metrics | Cloud Monitoring |
| Alerts | Cloud Monitoring Alerting Policies |

### OpenTelemetry Integration
```javascript
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(new TraceExporter())
);
provider.register();
```

### LangSmith (External)
Works alongside Cloud Trace for LLM-specific debugging.

---

## 6. Event Sources (Triggers)

| Trigger Type | GCP Service |
|--------------|-------------|
| HTTP Request | Cloud Endpoints, API Gateway |
| Schedule (Cron) | Cloud Scheduler |
| Queue | Pub/Sub, Cloud Tasks |
| Stream | Pub/Sub, Dataflow |
| Webhook (External) | Cloud Run / Functions HTTP trigger |

### Cloud Scheduler Example
```bash
gcloud scheduler jobs create http ambient-agent \
  --schedule="*/5 * * * *" \
  --uri="https://my-agent-xxx.run.app/tick" \
  --http-method=POST \
  --oidc-service-account-email=scheduler@my-project.iam.gserviceaccount.com
```

---

## 7. Security Best Practices

1. **Workload Identity**: Use Workload Identity for GKE, or default service accounts for Cloud Run.
2. **Secret Manager**: Store all secrets in Secret Manager.
3. **VPC Service Controls**: Restrict data exfiltration.
4. **Binary Authorization**: Only deploy signed container images.
5. **IAM Conditions**: Limit access by time, resource, or attribute.

---

## 8. GCP-Specific Features

### Vertex AI Agent Builder
Low-code/no-code agent builder with built-in:
- Grounding (RAG with Google Search or your data)
- Tool use
- Multi-turn conversation

### Gemini-Specific Features
- **Long Context**: 1M+ token context window
- **Grounding with Google Search**: Real-time web access
- **Code Execution**: Run Python code within the model

```javascript
const model = vertexAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools: [{
    googleSearchRetrieval: {
      dynamicRetrievalConfig: {
        mode: "MODE_DYNAMIC",
        dynamicThreshold: 0.5,
      },
    },
  }],
});
```

---

## Example: Deploying with Cloud Run

```dockerfile
# Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "index.js"]
```

```bash
# Deploy
gcloud run deploy my-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest \
  --min-instances 1 \
  --memory 1Gi
```

---

## Cost Optimization

- Use **Cloud Run min-instances=0** for dev, **=1** for prod (avoids cold starts).
- Use **Committed Use Discounts** for Vertex AI.
- Use **Pub/Sub** for async processing (cheaper than sync).
- Cache embeddings in **Memorystore** to reduce Vertex AI calls.

---

## Comparison: GCP vs AWS vs Azure

| Feature | GCP | AWS | Azure |
|---------|-----|-----|-------|
| Best Model Access | Gemini, Claude, Llama | Claude (Bedrock), Titan | GPT-4o, Claude* |
| Serverless Compute | Cloud Run | Lambda, Fargate | Container Apps, Functions |
| Vector DB | Vertex AI Vector Search | OpenSearch | Azure AI Search |
| State Store | Firestore | DynamoDB | Cosmos DB |
| Unique Strength | Gemini long context, BigQuery ML | Most integrations | Enterprise compliance |

*Claude on Azure is in preview
