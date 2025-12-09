# Enterprise Scenario: The "HR Onboarding Orchestrator"

## The Business Problem
Onboarding a new employee is a logistical nightmare involving IT, HR, Security, and Payroll.
- IT needs to provision a laptop and email.
- Security needs to issue a badge.
- Payroll needs tax forms.
- Manager needs to schedule 1:1s.
Humans (HR Coordinators) behave as "routers" for emails, which is error-prone.

## The Agent Solution
A **Stateful Workflow Agent** that owns the "Employee Lifecycle" object. It persists for 2 weeks (the duration of onboarding) and nudges various departments until the definition of done is met.

## Agent Workflow (LangGraph)
1.  **Trigger**: "Offer Letter Signed" event in Workday/Greenhouse.
2.  **Node: Partition Tasks**:
    *   Send Ticket to IT: "Ship Mac to [Address] by [Start Date]".
    *   Send Email to Manager: "Pick a buddy for [New Hire]".
3.  **Node: Monitor & Nudge (The Long Loop)**:
    *   Wake up every 24 hours.
    *   Check Status of IT Ticket (Jira API).
    *   Check Status of Manager Task (Did they reply?).
    *   *Logic*: If StartDate < 3 days and IT Ticket != Done, escalate to IT Director (Slack).
4.  **Node: Day 1 Welcome**:
    *   Once all tasks done: Email New Hire with "Here are all your passwords and links".

## Implementation Details
*   **Persistence**: This is the key feature. The graph state (`{ laptop_sent: bool, badge_ready: bool }`) must be stored in Postgres/Redis for weeks.
*   **Tools**:
    *   `jira_create_ticket`
    *   `slack_send_dm`
    *   `okta_create_user`
    *   `google_calendar_schedule`
*   **Human-in-the-loop**: If the API call to Okta fails (common), the agent pauses and asks an IT human to fix it manually, then resumes.

## Why usage of Agents?
It turns a spreadseheet checklist into active code. It ensures no new hire shows up on Day 1 without a laptop.
