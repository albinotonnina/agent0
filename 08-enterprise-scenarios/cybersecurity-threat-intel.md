# Enterprise Scenario: The "Threat Intelligence" Agent

## The Business Problem
Security Operations Centers (SOCs) are overwhelmed with thousands of alerts daily. 95% are false positives. Analysts spend hours investigating routine events while sophisticated attacks slip through.

## The Agent Solution
A **Cyber Defense Agent** that triages alerts, enriches them with threat intelligence, and generates investigation playbooks—or auto-remediates low-risk threats.

## Agent Workflow (LangGraph)
1.  **Trigger**: SIEM (Splunk/Sentinel) fires alert: "Unusual outbound traffic to IP 1.2.3.4."
2.  **Node: Enrichment**:
    *   Query VirusTotal: "Is IP 1.2.3.4 malicious?" -> Score: 12/80 (Low).
    *   Query Shodan: "What is this IP?" -> "AWS EC2 in us-east-1."
    *   Check internal asset DB: "Which host made this connection?" -> "finance-server-03."
3.  **Node: Context Analysis**:
    *   Pull recent authentication logs for `finance-server-03`.
    *   Check: "Has this server connected to this IP before?" -> "No, first time."
4.  **Node: Risk Scoring**:
    *   LLM: "Low threat intel score, but first-time connection from a finance server to an unknown cloud IP is suspicious. Risk: MEDIUM."
5.  **Node: Playbook Generation**:
    *   "Recommended Actions: 1) Check if a new software was installed. 2) Verify with finance team. 3) If unexplained, isolate host."
6.  **Node: Auto-Remediation** (Conditional):
    *   If Risk = CRITICAL (e.g., known C2 server), automatically block IP at firewall.

## Implementation Details
*   **Tools**:
    *   `virustotal_api.check_ip()`
    *   `crowdstrike_api.get_host_details()`
    *   `firewall_api.block_ip()`
*   **SOAR Integration**: This agent acts as the "brain" for a SOAR (Security Orchestration) platform.
*   **Audit Trail**: Every decision must be logged for forensic review.

## Why Agents?
The agent reads 5 dashboards in 10 seconds. A human takes 30 minutes. And unlike a pure automation script, the LLM can interpret novel attack patterns.
