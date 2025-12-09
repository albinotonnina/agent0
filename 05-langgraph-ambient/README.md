# Approach 5: Ambient Agent (Background Loop)

## Overview
An **Ambient Agent** is an AI that operates continuously in the background, monitoring streams of data (emails, logs, news, stock prices) and "waking up" only when specific criteria are met. 

It proactively interrupts the user, rather than waiting for the user to ask a question.

## LangGraph Concepts Used
1.  **Cyclic Graph**: The graph has no "End" (conceptually). It loops from `Start` -> `Check` -> `Sleep` -> `Start`.
2.  **State Persistence**: It needs to remember "What did I see last time?" so it doesn't alert you about the same email twice.
3.  **Autonomous Decision Making**: It uses the LLM to filter noise. It only alerts if the LLM judges the content as `URGENT`.

## The Scenario
The agent monitors a (simulated) news feed.
- It stays silent for boring news.
- It interrupts you when "Critical Market News" appears.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
