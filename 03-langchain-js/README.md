# Approach 3: LangChain.js

## Overview
LangChain is the "Enterprise Java" of AI frameworks. It is powerful, opinionated, and comes with a lot of abstractions. It is great if you need to switch between many different LLM providers, vector databases, and memory systems without changing your code structure.

## How it works
1. **AgentExecutor**: This class does the heavy lifting. It implements the "Think -> Act -> Observe" loop for you.
2. **Prompts**: You use `ChatPromptTemplate` to construct the context window.
3. **Scratchpad**: LangChain uses a special variable `{agent_scratchpad}` in the prompt to automatically inject the history of tool calls and results.

## Pros & Cons
*   **Pros**: Extremely consistent API, thousands of pre-built integrations (databases, slack, google search), highly configurable "Agent Executors".
*   **Cons**: High complexity, large learning curve, can feel like "over-engineering" for simple agents, harder to debug the raw prompt being sent.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
