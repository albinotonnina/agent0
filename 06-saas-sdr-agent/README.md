# Approach 6: The Commercial SaaS Agent

## Overview
This illustrates how you build a **Product**, not just a chat script. 
Most "Agent Startups" are essentially this pattern wrapped in a Next.js UI.

## Commercial Traits Implemented
1.  **Strict Billing Logic**: The agent *refuses to work* if the user has no credits. This is a "Gatekeeper Node" pattern.
2.  **Specialized Pipeline**: It performs a specific, high-value workflow (SDR Research) rather than generic chat.
3.  **No Chat Interface**: It takes parameters (`URL`) and returns a Deliverable (`Email Draft`). It is designed to be an API endpoint, not a chatbot.

## The Scenario: AutoSDR
*   User inputs a target company URL.
*   Agent checks if User has >= 5 credits.
*   Agent scrapes the site, finds the CEO, and writes a personalized email.
*   Agent deducts credits.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
