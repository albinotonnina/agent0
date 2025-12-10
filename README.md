# JavaScript AI Agent Examples

This repository contains instructional examples of three different ways to build AI agents in JavaScript/Node.js.

## The Three Approaches

### 1. [Manual Loop (The Low-Level Way)](./01-manual-loop)
*   **Best for**: Understanding exactly how agents work, or for maximizing control/minimizing dependencies.
*   **Concept**: You write the `while` loop yourself and handle the API calls directly.

### 2. [Vercel AI SDK (The Modern Way)](./02-vercel-ai-sdk)
*   **Best for**: Web developers, Vercel/Next.js users, and those who want clean, type-safe code.
*   **Concept**: A lightweight library that abstracts the loop but keeps the code simple and readable.

### 3. [LangChain.js (The Framework Way)](./03-langchain-js)
*   **Best for**: Complex enterprise apps requiring integrations with many different tools/databases.
*   **Concept**: A heavy-duty framework with powerful abstractions for "Chains", "Memory", and "Agents".

### 4. [LangGraph (The Enterprise Grade Way)](./04-langgraph-complex)
*   **Best for**: Mission-critical business processes, compliance workflows, and human-in-the-loop systems.
*   **Concept**: Defines the agent as a **State Graph** (Nodes & Edges) rather than a loop. Enforces strict flow control and auditability.

### 5. [Ambient Agent (The Background Monitor)](./05-langgraph-ambient)
*   **Best for**: Personal assistants, monitoring systems, and pro-active helpers.
*   **Concept**: An infinite loop that "sleeps" and "wakes". It speaks first, instead of waiting for input. It filters noise and only interrupts for important events.

### 6. [Commercial SaaS Agent (The Product)](./06-saas-sdr-agent)
*   **Best for**: Building a startup or monetizable API service.
*   **Concept**: Adds "Gatekeeper Nodes" (Billing/Auth) before the work begins. Optimized for specific, high-value tasks (like Sales Prospecting) rather than generic chat.

### 7. [SaaS Customer Support (The Observability Demo)](./07-saas-customer-support)
*   **Best for**: Production Support Bots, RAG systems, and systems needing debugging.
*   **Concept**: A RAG (Retrieval) agent that focuses on **Observability**. It is designed to work with **LangSmith** so you can trace errors and evaluate retrieval quality.

### 8. [Real World Enterprise Scenarios (Documentation)](./08-enterprise-scenarios)
*   **Best for**: Understanding the business value and architecture of agents in the real world.
*   **Concept**: A collection of Markdown files explaining architectures for **Legal**, **SRE**, **HR**, **Supply Chain**, and **Insurance** agents.

### 9. [Cloud Deployment (AWS / Azure / GCP)](./09-cloud-deployment)
*   **Best for**: DevOps engineers deploying agents to production.
*   **Concept**: Detailed guides for each major cloud provider covering compute options, model hosting, state persistence, vector stores, and security best practices.

## Getting Started

1.  **Get an API Key**: You need an Anthropic API Key.
2.  **Configure**: Create a `.env` file in the folder you want to run.
    ```
    ANTHROPIC_API_KEY=sk-ant-...
    ```
3.  **Run**:
    ```bash
    cd 01-manual-loop
    npm install
    npm start
    ```
