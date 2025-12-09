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
