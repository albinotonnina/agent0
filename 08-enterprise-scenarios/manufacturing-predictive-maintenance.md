# Enterprise Scenario: The "Predictive Maintenance" Agent

## The Business Problem
Manufacturing plants have thousands of machines. Unplanned downtime costs $10k-$100k per hour. Traditional maintenance is either too late (reactive) or too expensive (fixed schedules).

## The Agent Solution
An **IoT-Integrated Agent** that monitors sensor data (temperature, vibration, pressure), predicts failures before they happen, and schedules maintenance during planned downtime windows.

## Agent Workflow (LangGraph)
1.  **Trigger**: Anomaly detected in sensor stream (Vibration spiked 20% on Machine #42).
2.  **Node: Historical Analysis**:
    *   Query: "Has Machine #42 had similar vibration patterns before a failure?"
    *   Result: "Yes, twice. Both times bearing failure occurred within 72 hours."
3.  **Node: Part Lookup**:
    *   Check spare parts inventory. "Bearing SKU-1234 in stock: 3 units."
4.  **Node: Schedule Optimization**:
    *   Check production calendar. "Next planned downtime: Saturday 2 AM."
    *   Calculate: "If failure probability > 80% before Saturday, schedule emergency stop."
5.  **Node: Work Order Generation**:
    *   Create work order in CMMS (Computerized Maintenance Management System).
    *   Assign to closest available technician.
6.  **Node: Notification**:
    *   Alert Plant Manager: "Machine #42 scheduled for bearing replacement Saturday. Failure probability before then: 15%."

## Implementation Details
*   **Tools**:
    *   `iot_platform.get_sensor_history(machine_id)`
    *   `cmms_api.create_work_order()`
    *   `inventory_system.check_stock(part_sku)`
*   **ML Integration**: The anomaly detection is typically a separate ML model. The agent orchestrates the *response* to the anomaly.
*   **Feedback Loop**: Log whether the predicted failure actually occurred to improve future predictions.

## Why Agents?
The agent connects the dots between IoT data, maintenance history, parts inventory, and scheduling—something no single system does alone.
