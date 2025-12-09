# Enterprise Scenario: The "Medical Coding" Agent

## The Business Problem
After a doctor sees a patient, a "Medical Coder" translates the visit notes into ICD-10 codes for billing. This is tedious, error-prone, and a massive bottleneck in Revenue Cycle Management (RCM). Incorrect codes lead to rejected claims and lost revenue.

## The Agent Solution
A **Clinical NLP Agent** that reads physician notes and suggests the correct diagnosis and procedure codes, with supporting evidence.

## Agent Workflow (LangGraph)
1.  **Input**: Physician's dictated notes (unstructured text).
2.  **Node: Entity Extraction**:
    *   Identify symptoms, diagnoses, procedures. "Patient presents with acute lower back pain. MRI performed."
3.  **Node: Code Lookup (RAG)**:
    *   Search ICD-10 database. "Acute lower back pain" -> M54.5.
    *   Search CPT database. "MRI lumbar spine" -> 72148.
4.  **Node: Specificity Check**:
    *   ICD-10 requires specificity. Agent asks: "Is the pain on the left or right side? Is it chronic or acute?"
    *   If info is missing, flag for human query or pull from EHR.
5.  **Node: Compliance & Bundling**:
    *   Check for "unbundling" violations (billing separately for things that should be combined).
    *   Check for "upcoding" risk.
6.  **Node: Output**:
    *   Submit codes to billing system with confidence scores.

## Implementation Details
*   **Tools**:
    *   `icd10_vector_search(description)`
    *   `cpt_code_lookup(procedure)`
    *   `ehr_query(patient_id, field)`
*   **Accuracy Requirement**: Must be >95% accurate. Incorrect codes cost money (rejected claims) or risk fraud allegations (overbilling).
*   **Evaluation**: Run against a "Gold Standard" dataset of 1000 historically coded charts.

## Why Agents?
A coder spends 15 minutes per chart. The agent does it in 15 seconds and the human just verifies.
