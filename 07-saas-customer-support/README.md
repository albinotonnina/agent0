# Approach 7: SaaS Customer Support (Observability)

## Overview
This demonstrates how to build a **Production-Ready Support Bot** that is fully observable.

In a SaaS context, agents often fail silently (e.g., they hallucinate an answer). You need **LangSmith** to debug this.

## Key Features
1.  **RAG (Retrieval Augmented Generation)**: The agent searches a "Knowledge Base" (mocked) before answering.
2.  **Strict Context**: The prompt forces the agent to use *only* the retrieved docs, reducing hallucinations.
3.  **Observability Setup**: The code checks for `LANGCHAIN_API_KEY` to enable cloud tracing.

## How to use LangSmith
1.  Sign up at [smith.langchain.com](https://smith.langchain.com).
2.  Get an API Key.
3.  Add it to your `.env`:
    ```
    LANGCHAIN_TRACING_V2=true
    LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
    LANGCHAIN_API_KEY=ls-...
    LANGCHAIN_PROJECT=default
    ```

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=...` (and optionally the LangChain keys).
2. Run `npm install`
3. Run `npm start`
