# Enterprise Scenario: The "Fraud Detection" Agent

## The Business Problem
Banks lose billions annually to fraud. The challenge: 99.9% of transactions are legitimate. Traditional rule-based systems either miss sophisticated fraud or create too many "false positives" that annoy customers.

## The Agent Solution
A **Real-Time Decision Agent** that runs on every transaction over a threshold. It combines traditional ML scores with LLM "Reasoning" to explain *why* a transaction is suspicious.

## Agent Workflow (LangGraph)
1.  **Trigger**: Transaction API receives a $5,000 wire transfer.
2.  **Node: ML Scoring**: Run traditional XGBoost model. Score: 0.72 (Medium Risk).
3.  **Node: Context Enrichment**:
    *   Pull customer's last 30 days of transactions.
    *   Pull device fingerprint history.
    *   Pull geolocation vs. home address.
4.  **Node: LLM Reasoning**:
    *   "This customer typically makes small purchases in Chicago. This is a $5k wire to Nigeria from a new device in Miami. Confidence: HIGH RISK."
5.  **Node: Action Router**:
    *   If RISK > 0.9: Block transaction, send SMS verification.
    *   If RISK 0.6-0.9: Flag for human review in Fraud Ops queue.
    *   If RISK < 0.6: Approve.
6.  **Node: Explainability Log**: Write reasoning to audit table for compliance.

## Implementation Details
*   **Latency Constraint**: Must complete in < 200ms for real-time UX. Consider using smaller models (Haiku) for the reasoning step.
*   **Tools**:
    *   `fraud_ml_model.predict(features)`
    *   `customer_history_db.query()`
    *   `maxmind_geoip.lookup(ip)`
*   **Compliance**: Banks are regulated. The "Explainability Log" is mandatory. You must be able to tell a regulator *why* you blocked a customer.

## Why Agents?
The LLM adds the "Last Mile" of reasoning that ML models can't provide. It can articulate "This is unusual because X and Y together."
