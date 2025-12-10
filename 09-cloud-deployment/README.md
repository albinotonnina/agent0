# Cloud Deployment Guide for AI Agents

This folder contains detailed guides for deploying AI agents on the three major cloud providers.

---

## Quick Comparison

| Feature | AWS | Azure | GCP |
|---------|-----|-------|-----|
| **Primary LLM** | Bedrock (Claude, Titan) | Azure OpenAI (GPT-4o) | Vertex AI (Gemini, Claude) |
| **Best Serverless Compute** | Lambda + Fargate | Container Apps | Cloud Run |
| **State Store** | DynamoDB | Cosmos DB | Firestore |
| **Vector Database** | OpenSearch Serverless | Azure AI Search | Vertex AI Vector Search |
| **Secret Management** | Secrets Manager | Key Vault | Secret Manager |
| **Unique Strength** | Most integrations, mature | Enterprise compliance | Gemini long context, BigQuery |

---

## Guides

1. [**AWS**](./aws.md) - Lambda, Fargate, Bedrock, DynamoDB
2. [**Azure**](./azure.md) - Container Apps, Azure OpenAI, Cosmos DB
3. [**GCP**](./gcp.md) - Cloud Run, Vertex AI, Firestore

---

## Universal Recommendations

### For All Providers
1. **Use Managed Secrets**: Never hardcode API keys. Use the provider's secret manager.
2. **Enable Tracing**: Integrate with LangSmith AND native cloud tracing (X-Ray / App Insights / Cloud Trace).
3. **Implement Checkpointing**: Use a document database (DynamoDB/Cosmos/Firestore) for LangGraph state.
4. **Set Up Alerts**: Monitor error rates, latency, and cost anomalies.

### Choosing a Provider
- **AWS**: Best for existing AWS shops with Lambda expertise.
- **Azure**: Best for Microsoft enterprises needing GPT-4o with compliance.
- **GCP**: Best for Gemini-first projects or BigQuery-heavy analytics workflows.
