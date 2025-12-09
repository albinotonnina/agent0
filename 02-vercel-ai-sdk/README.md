# Approach 2: Vercel AI SDK

## Overview
The Vercel AI SDK (`ai`) is a lightweight library designed for building AI-powered web applications. It abstracts away the tedious parts of the "Manual Loop" while staying close to the metal.

## How it works
1. **Unified Interface**: You use `generateText` which works with OpenAI, Anthropic, Mistral, etc., just by changing the model string.
2. **Integrated Tools**: You define tools using the `tool()` helper, which combines the **Zod schema** (for validation) with the **JavaScript implementation**.
3. **Auto-Loop**: By setting `maxSteps > 1`, you tell the SDK to automatically handle the "Call -> Execute -> Loop" cycle.

## Pros & Cons
*   **Pros**: extremely clean code, TypeScript-first (great for validation), keeps logic and definition together, standardized API across providers.
*   **Cons**: Slightly more abstraction than raw API (but very thin).

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
