# Enterprise Scenario: The "SRE Incident Responder" Agent

## The Business Problem
When a production alert fires (e.g., "High Latency on Payment API"), typical SREs spend the first 30 minutes just gathering context:
- Checking logs (Splunk/Datadog)
- Checking recent deployments (GitHub/Jenkins)
- Checking database health (RDS/Prometheus)

This response time (MTTR) directly costs money.

## The Agent Solution
An **Ambient Agent** that listens to the PagerDuty webhook. When an alert triggers, it instantly runs a diagnostic playbook and posts a "Situation Report" to the Slack incident channel *before* the human SRE even opens their laptop.

## Agent Workflow (LangGraph)
1.  **Trigger**: Webhook from PagerDuty.
2.  **Node: Triage**:
    *   Classify the alert (Database vs Network vs App Code).
3.  **Node: Investigation** (Parallel Execution):
    *   **Branch A**: Query Datadog for error sketches (Stack Traces).
    *   **Branch B**: Query Git for commits in the last 60 mins.
    *   **Branch C**: Check AWS CloudWatch for CPU spikes.
4.  **Node: Analysis**: use LLM to correlate Branch A+B+C ("CPU spiked right after Commit X merged").
5.  **Node: Remediation Proposal**:
    *   Suggest a rollback command.
    *   *CRITICAL*: Pause for **Human Approval** via Slack Button.
6.  **Node: Action**: Execute rollback (if approved).

## Implementation Details
*   **Tools**:
    *   `datadog_query_metric(query)`
    *   `github_list_recent_commits(repo)`
    *   `k8s_get_pod_logs(namespace)`
*   **State**: Needs to maintain a "Timeline" of findings to generate a final post-mortem report.
*   **Security**: Read-only access to Prod by default. Write access (Restart/Rollback) requires a specific "Break Glass" permission scope managed by the `human_approval` node.

## Why usage of Agents?
Speed. An agent can run 5 sequential searches in 10 seconds. A human takes 10 minutes.
