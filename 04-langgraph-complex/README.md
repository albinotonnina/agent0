# Approach 4: Enterprise State Graph (LangGraph)

## Overview
This demonstrates **LangGraph**, the enterprise-grade extension of LangChain. 

Unlike the previous examples which were simple "loops" (Think -> Act -> Repeat), this is a **Directed Acyclic Graph (DAG)** (mostly) or a **State Machine**.

## Why this is "Enterprise Grade"
1.  **Determinism**: We define exactly which states are possible. The agent cannot randomly decide to "skip" the policy check because the Graph geometry forces it to go through the `policy_check` node.
2.  **Compliance**: We can trace the path of every execution. "Why was this approved?" -> "Because it went through edge A->B->C".
3.  **Human-in-the-loop**: This architecture supports pausing execution at the `human_approval` node and serializing the state to a database, waiting days for a manager to click "Approve", and then resuming exactly where it left off. (Simulated in this script).

## The Scenario: Expense Approvals
*   **Small amounts (< $50)**: Auto-approved.
*   **Medium amounts ($50 - $1000)**: Routed to a Human Manager for approval.
*   **Large amounts (> $1000)**: Auto-rejected for safety.
*   **Policy Violations**: Alcohol on weekdays is automatically rejected.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`
