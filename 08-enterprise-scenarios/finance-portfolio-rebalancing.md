# Enterprise Scenario: The "Portfolio Rebalancing" Agent

## The Business Problem
Wealth management firms must periodically rebalance client portfolios (e.g., 60% stocks / 40% bonds). This involves analyzing drift, tax implications, and client preferences. Human advisors can only handle 50-100 clients each.

## The Agent Solution
An **Autonomous Financial Advisor** that generates rebalancing proposals for thousands of accounts overnight. It respects individual constraints (ESG preferences, tax-loss harvesting opportunities).

## Agent Workflow (LangGraph)
1.  **Trigger**: Nightly cron job at 2 AM.
2.  **Node: Fetch Portfolio**:
    *   For each client, retrieve current holdings from Custodian API.
3.  **Node: Calculate Drift**:
    *   "Current allocation: 72% stocks, 28% bonds. Target: 60/40. Drift: +12%."
4.  **Node: Tax Analysis**:
    *   Identify lots with losses for tax-loss harvesting.
    *   Flag short-term vs. long-term gains.
5.  **Node: Constraint Check**:
    *   Client A: "No fossil fuels". Ensure proposed buys pass ESG filter.
6.  **Node: Trade Generation**:
    *   Output: "Sell $50k of SPY (long-term gain). Buy $30k of BND. Buy $20k of ESGU."
7.  **Node: Compliance Review (Human-in-the-Loop)**:
    *   Queue trades for Compliance Officer approval before execution.

## Implementation Details
*   **Tools**:
    *   `custodian_api.get_positions(account_id)`
    *   `market_data.get_price(ticker)`
    *   `tax_lot_db.get_cost_basis(position_id)`
*   **Scale**: Runs for 10,000+ accounts. Must be highly parallelized (LangGraph supports this).
*   **Auditability**: Every decision must be logged for SEC/FINRA examinations.

## Why Agents?
The LLM handles the "fuzzy" parts: interpreting client notes like "I'm nervous about tech stocks" and factoring that into the proposal.
