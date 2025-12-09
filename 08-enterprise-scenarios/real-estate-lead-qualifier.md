# Enterprise Scenario: The "Real Estate Lead Qualifier" Agent

## The Business Problem
Real estate agents get hundreds of Zillow/Realtor.com leads. 90% are tire-kickers. Agents waste hours calling unqualified leads while hot buyers go cold.

## The Agent Solution
A **Conversational SDR Agent** that engages every lead via SMS/Email within 60 seconds of inquiry. It qualifies them (Budget, Timeline, Pre-Approval) and books showings directly on the agent's calendar.

## Agent Workflow (LangGraph)
1.  **Trigger**: Lead fills out form: "Interested in 123 Main St."
2.  **Node: Initial Outreach**:
    *   Send SMS: "Hi [Name]! Thanks for your interest in 123 Main St. Are you pre-approved for a mortgage?"
3.  **Node: Qualification Loop** (Multi-Turn Conversation):
    *   Collect: Budget, Timeline ("Looking to buy in 3 months"), Current Situation (Renting? Selling?).
    *   Store answers in state.
4.  **Node: Scoring**:
    *   Score lead: A (Hot), B (Warm), C (Cold).
    *   A: Pre-approved, budget matches listing, timeline < 90 days.
5.  **Node: Routing**:
    *   A Leads: Book showing via Calendly API. Notify agent via Slack.
    *   B Leads: Add to nurture campaign (Mailchimp).
    *   C Leads: Polite disqualification email.

## Implementation Details
*   **Tools**:
    *   `twilio_send_sms()`
    *   `calendly_book_event(agent_id, time)`
    *   `crm_update_lead(lead_id, fields)`
*   **Natural Language**: The agent must sound human. Use a specific persona prompt: "You are Sarah, a friendly real estate assistant."
*   **Guardrails**: Never discuss listing price negotiation. Redirect those to the human agent.

## Why Agents?
Speed-to-lead is the #1 predictor of conversion. Responding in 60 seconds vs. 60 minutes increases contact rate by 10x.
