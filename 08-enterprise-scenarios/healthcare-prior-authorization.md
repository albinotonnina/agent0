# Enterprise Scenario: The "Prior Authorization" Agent

## The Business Problem
Before a hospital can perform an expensive procedure (MRI, surgery), the insurance company must approve it ("Prior Auth"). This involves faxes, phone calls, and paperwork. Delays harm patients and frustrate providers.

## The Agent Solution
A **Negotiation Agent** that automatically submits prior auth requests, monitors their status, and appeals denials using the insurer's own policy language.

## Agent Workflow (LangGraph)
1.  **Trigger**: Doctor orders an MRI.
2.  **Node: Pre-Check**:
    *   Check patient's insurance plan. Does this procedure require prior auth? (Some don't).
3.  **Node: Form Generation**:
    *   Auto-fill the Prior Auth form with patient demographics, diagnosis codes, and clinical justification.
4.  **Node: Submission**:
    *   Submit via insurer's API (or if legacy, generate a fax PDF).
5.  **Node: Status Monitor (Ambient Loop)**:
    *   Poll insurer's portal daily. Status: Pending -> Approved / Denied.
6.  **Node: Denial Appeal**:
    *   If Denied, retrieve the denial reason. "Not medically necessary."
    *   Search the insurer's published clinical guidelines for counter-evidence.
    *   Draft an appeal letter citing the specific guideline the insurer violated.
7.  **Node: Escalation**: If 2nd denial, alert human case manager.

## Implementation Details
*   **Tools**:
    *   `insurance_portal_api.submit_auth()`
    *   `insurance_portal_api.check_status()`
    *   `clinical_guidelines_rag.search()`
*   **Persistence**: An auth request can take 2 weeks. The agent state must be persisted in a database and resume on status changes.
*   **Compliance**: HIPAA requires all PHI to be encrypted and access-logged.

## Why Agents?
A human spends 30 minutes per auth. Hospitals submit hundreds daily. This agent turns a cost center into an automated utility.
