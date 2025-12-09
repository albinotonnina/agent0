# Enterprise Scenario: The "Customer Churn Prevention" Agent

## The Business Problem
Subscription businesses (SaaS, Telecom, Media) lose 5-15% of customers annually. By the time a customer calls to cancel, it's often too late. Proactive intervention is key.

## The Agent Solution
An **Ambient Retention Agent** that monitors usage patterns, identifies at-risk accounts, and triggers personalized outreach before the customer churns.

## Agent Workflow (LangGraph)
1.  **Trigger**: Nightly batch job.
2.  **Node: Churn Scoring**:
    *   Run ML model on usage data: logins, feature usage, support tickets.
    *   Output: List of customers with Churn Risk > 70%.
3.  **Node: Root Cause Analysis**:
    *   For each at-risk customer, LLM analyzes: "Login frequency dropped 80%. Last support ticket: 'How do I cancel?' Product feature adoption: 10%."
4.  **Node: Intervention Selection**:
    *   Based on root cause:
        *   Low adoption -> Offer free training webinar.
        *   Price complaint -> Offer discount or downgrade path.
        *   Competitor mention -> Connect to Account Executive.
5.  **Node: Outreach Execution**:
    *   Send personalized email.
    *   Log interaction in CRM.
6.  **Node: Track Outcome** (Ambient Loop):
    *   Did customer open email? Book a call? Churn anyway?
    *   Feed back into ML model.

## Implementation Details
*   **Tools**:
    *   `analytics_db.get_usage_metrics(customer_id)`
    *   `crm_api.create_task()`
    *   `email_api.send_templated_email()`
*   **Personalization**: The agent rewrites email subject lines based on customer's industry and past interactions.
*   **A/B Testing**: Test different interventions to find what works best.

## Why Agents?
Saving one enterprise customer ($100k ARR) pays for the entire AI program. The agent catches signals humans miss.
