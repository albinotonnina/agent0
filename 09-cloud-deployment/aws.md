# Deploying AI Agents on AWS

This guide explains how to deploy production-grade AI agents on Amazon Web Services.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Agent Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │ API GW   │────▶│    Lambda    │────▶│   Bedrock / Claude API   │ │
│  │ / ALB    │     │  or Fargate  │     │   (Model Invocation)     │ │
│  └──────────┘     └──────────────┘     └──────────────────────────┘ │
│                          │                                           │
│                          ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    State & Memory Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ DynamoDB   │  │ ElastiCache│  │ OpenSearch / Pinecone  │  │   │
│  │  │ (State)    │  │ (Cache)    │  │ (Vector Store / RAG)   │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Compute Options

| Service | Best For | Cold Start | Cost Model |
|---------|----------|------------|------------|
| **Lambda** | Short, stateless invocations (<15 min) | Yes (seconds) | Per-invocation |
| **Fargate (ECS)** | Long-running agents, ambient loops | No | Per-second |
| **App Runner** | Simple HTTP agents | No | Per-second |
| **Step Functions** | Orchestrating multi-step workflows | N/A | Per-state-transition |

### Recommendation
- **Simple Agents**: Lambda + API Gateway
- **LangGraph Agents**: Fargate (for long-running state graphs)
- **Ambient Agents**: Fargate + EventBridge (cron triggers)

---

## 2. Model Hosting

### Option A: Amazon Bedrock (Managed)
AWS's managed LLM service. Supports Claude (Anthropic), Titan, Llama, etc.

```javascript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const response = await client.send(new InvokeModelCommand({
  modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 1024,
  }),
}));
```

**Pros**: No API key management, IAM-based auth, stays in your VPC.
**Cons**: Slightly behind on latest model versions.

### Option B: External API (Anthropic Direct)
Call Anthropic's API directly. Store `ANTHROPIC_API_KEY` in AWS Secrets Manager.

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secret = await secretsClient.send(
  new GetSecretValueCommand({ SecretId: "anthropic-api-key" })
);
const apiKey = JSON.parse(secret.SecretString).ANTHROPIC_API_KEY;
```

---

## 3. State Persistence (LangGraph)

LangGraph requires a "Checkpointer" to save state between steps.

### DynamoDB Checkpointer
```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBCheckpointer } from "@langchain/langgraph-checkpoint-dynamodb"; // Hypothetical

const checkpointer = new DynamoDBCheckpointer({
  client: new DynamoDBClient({ region: "us-east-1" }),
  tableName: "agent-state",
});

const app = workflow.compile({ checkpointer });
```

### Table Schema
| PK (thread_id) | SK (checkpoint_id) | state (JSON) | timestamp |
|----------------|-------------------|--------------|-----------|

---

## 4. RAG / Vector Store

### Option A: Amazon OpenSearch Serverless (Vector Engine)
Fully managed, scales to zero.

### Option B: Amazon Bedrock Knowledge Bases
Upload documents -> Bedrock handles chunking, embedding, and retrieval.

### Option C: Pinecone / Weaviate (External)
More flexibility, better for multi-cloud.

---

## 5. Observability

| Need | AWS Service |
|------|-------------|
| Logs | CloudWatch Logs |
| Traces | X-Ray (native) or LangSmith (external) |
| Metrics | CloudWatch Metrics |
| Alerts | CloudWatch Alarms -> SNS |

### LangSmith Integration
Set environment variables in your Lambda/Fargate:
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls-...
LANGCHAIN_PROJECT=production
```

---

## 6. Event Sources (Triggers)

| Trigger Type | AWS Service |
|--------------|-------------|
| HTTP Request | API Gateway, ALB |
| Schedule (Cron) | EventBridge Scheduler |
| Queue | SQS |
| Stream | Kinesis, DynamoDB Streams |
| Webhook (External) | API Gateway -> Lambda |

---

## 7. Security Best Practices

1. **Secrets**: Store API keys in Secrets Manager, not environment variables.
2. **IAM**: Use least-privilege roles. Agents should only access required services.
3. **VPC**: Run Fargate tasks in a private subnet. Use VPC Endpoints for AWS services.
4. **Guardrails**: Use Bedrock Guardrails to filter harmful content.

---

## Example: Deploying an Ambient Agent

```yaml
# serverless.yml (Serverless Framework)
service: ambient-agent

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1

functions:
  monitor:
    handler: index.handler
    events:
      - schedule: rate(5 minutes) # Wake up every 5 mins
    environment:
      DYNAMODB_TABLE: agent-state
      ANTHROPIC_SECRET_ARN: arn:aws:secretsmanager:...
```

---

## Cost Optimization

- Use **Provisioned Concurrency** for Lambda if cold starts hurt latency.
- Use **Spot Fargate** for non-critical ambient agents (up to 70% savings).
- Cache LLM responses in **ElastiCache** for repeated queries.
