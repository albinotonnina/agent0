# Approach 1: The Manual Control Loop

## Overview
This is the "bare metal" way of building an agent. You directly interact with the AI provider's API (Anthropic in this case) and manage the recursive loop yourself.

## How it works
1. **State Management**: You hold a `messages` array in memory.
2. **The "Brain" (LLM)**: You send the implementation to the LLM along with a list of `tools`.
3. **The "Hands" (Code)**: If the LLM returns a `stop_reason` of `tool_use`, you pause, execute the corresponding JavaScript function locally, and capture the return value.
4. **The "Loop"**: You start the process again, this time including the result of the tool call in the `messages` array. The LLM sees this result and continues its train of thought.

## Pros & Cons
*   **Pros**: Zero external framework dependencies. Maximum control over every step. Debugging is easier because there is no "magic" hidden code.
*   **Cons**: Verbose. You have to write specific code to handle errors, tool execution, and state management.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
