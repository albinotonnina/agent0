# Enterprise Scenario: The "Legal Risk Analyst" Agent

## The Business Problem
Enterprise legal teams are drowning in NDAs (Non-Disclosure Agreements) and MSAs (Master Services Agreements). Reviewing a standard 20-page NDA takes a lawyer 1-2 hours ($500+ cost) just to spot the same 3 risky clauses (e.g., "Infinite Indemnification", "Non-Compete").

## The Agent Solution
A **Document Processing Agent** that automatically pre-screens every uploaded contract. It highlights "Red Flags" based on the company's specific Risk Playbook and generates a "Marked Up" version for the lawyer to finalize.

## Agent Workflow (LangGraph)
1.  **Input**: PDF/Docx uploaded to SharePoint/Drive.
2.  **Node: OCR & Chunking**: Convert scan to text, split by "Clause" (not just paragraph).
3.  **Node: Classification**: Map each paragraph to a concept (e.g., "Termination", "Liability").
4.  **Node: Risk Assessment** (Map-Reduce):
    *   For each clause, run: `check_against_playbook(clause_text, clause_type)`.
    *   *Example*: "If Liability Cap < 2x Fees, Flag as RED".
5.  **Node: Report Generation**:
    *   Create a comment on the exact line in the Word Doc.
    *   Draft a summary email: "This contract is 90% Clean, but has 2 critical risks in Section 4."

## Implementation Details
*   **Tools**:
    *   `textract_ocr` (AWS)
    *   `word_add_comment(file, index, comment)`
    *   `vector_store_search` (to find "Precedent contracts" - e.g., "How did we phrase this last time?")
*   **LangGraph Pattern**: **Map-Reduce**. The document is too long for one context window. The agent must process clauses in parallel (Map) and then synthesize a final risk score (Reduce).
*   **Evaluation (LangSmith)**: Crucial. You must run this against 100 past contracts and verify it flagged the same things the General Counsel did.

## Real World Impact
Reduces purely administrative legal review time by 80%. Lawyers only look at the "Red" flags.
