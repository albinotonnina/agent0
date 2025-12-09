// 04-langgraph-complex/index.js

import { StateGraph, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ToolMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 4: ENTERPRISE AGENT WITH LANGGRAPH
 * 
 * SCENARIO: "Corporate Expense Compliance Agent"
 * 
 * This agent demonstrates a robust, state-machine driven workflow for processing
 * expense reports. It is NOT just a while loop. It is a Graph.
 * 
 * THE WORKFLOW:
 * 1. [Initial Review]: AI classifies the receipt and converts currency.
 * 2. [Policy Check]: AI checks if the expense violates company policy.
 * 3. [Router]: 
 *    - If < $50: Auto-Approve.
 *    - If > $50 & < $1000: Needs Manager Approval (Human-in-the-loop).
 *    - If > $1000: Auto-Reject (Too risky for this demo).
 *    - If Policy Fail: Auto-Reject.
 * 4. [Human Approval]: Pauses execution and waits for a "Human" signal (Mocked here).
 * 5. [Finalize]: Logs the result.
 */

// 1. Define the Global State
// --------------------------
// This object moves through the graph. Every node receives it and returns updates to it.
const AgentState = {
    // The original input
    expenseDetails: null,

    // Accumulated data
    classification: null,
    amountUsd: null,
    riskScore: 0,

    // The chain of messages/logs
    logs: [],

    // Final status
    status: "PENDING", // PENDING, APPROVED, REJECTED, NEEDS_APPROVAL
};

// 2. Setup Tools & Model
// ----------------------
const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
});

// A tool to check policy (Mock)
const checkPolicyTool = tool(
    async ({ category }) => {
        console.log(`  [Tool] Consulting policy handbook for '${category}'...`);
        if (category === "Alcohol") return { allowed: false, reason: "No alcohol on weekdays." };
        if (category === "Electronics") return { allowed: true, limit: 500 };
        return { allowed: true, limit: 1000 };
    },
    {
        name: "check_policy",
        description: "Checks company policy for a given expense category.",
        schema: z.object({ category: z.string() })
    }
);

// 3. Define Nodes ( The Workers )
// -------------------------------
// Each function is a "Node" in the graph.

async function nodeInitialReview(state) {
    console.log("\n--- Node: Initial Review ---");
    const text = state.expenseDetails;

    // Ask LLM to extract structured data (Category & Amount)
    // implementing a mini-chain here
    const extractionPrompt = ChatPromptTemplate.fromMessages([
        ["system", "You are an expense classifier. Extract category and amount (in USD). Return JSON."],
        ["user", "{text}"]
    ]);

    // For simplicity in this demo, we'll just mock the extraction logic or ask the LLM for JSON
    // In a real app, you'd use `.withStructuredOutput(z.object(...))`
    const response = await model.invoke([
        ["system", "Extract JSON: { category: string, amount: number, risk_score: number (1-10) }."],
        ["user", text]
    ]);

    // Rudimentary parsing for the demo
    let data;
    try {
        const jsonStr = response.content.match(/\{[\s\S]*\}/)[0];
        data = JSON.parse(jsonStr);
    } catch (e) {
        data = { category: "Unknown", amount: 0, risk_score: 10 };
    }

    console.log(`  > Extracted: $${data.amount} for ${data.category} (Risk: ${data.risk_score})`);

    return {
        classification: data.category,
        amountUsd: data.amount,
        riskScore: data.risk_score,
        logs: [...state.logs, `Reviewed item: ${data.category}`],
    };
}

async function nodePolicyCheck(state) {
    console.log("\n--- Node: Policy Check ---");

    // Call the tool manually here (or let an agent do it)
    const policyResult = await checkPolicyTool.invoke({ category: state.classification });

    if (!policyResult.allowed) {
        console.log(`  > Policy Violation: ${policyResult.reason}`);
        return {
            status: "REJECTED",
            logs: [...state.logs, `Policy Violation: ${policyResult.reason}`]
        };
    }

    return {
        logs: [...state.logs, "Policy Check Passed"],
    };
}

async function nodeHumanApproval(state) {
    console.log("\n--- Node: Human Approval Required ---");
    console.log(`  > ALERT: Manager approval needed for ${state.classification} ($${state.amountUsd})`);

    // IN A REAL APP: This is where we would pause execution.
    // LangGraph supports `interruptBefore: ["human_approval"]`.
    // For this standalone script, we will SIMULATE a human interacting.

    console.log("  > ... Simulating Manager clicking 'Approve' ...");

    return {
        status: "APPROVED",
        logs: [...state.logs, "Manager Manually Approved"],
    };
}

async function nodeFinalize(state) {
    console.log("\n--- Node: Finalize ---");
    console.log(`  > Final Status: ${state.status}`);
    // Maybe send an email or write to DB
    return {};
}

// 4. Define Edges ( The Routing Logic )
// -------------------------------------
// This determines where to go next based on the state.

function routeAfterPolicy(state) {
    if (state.status === "REJECTED") {
        return "finalize";
    }

    const amount = state.amountUsd;

    if (amount > 1000) {
        console.log("  > Amount too high (>1000). Auto-Rejecting.");
        return "auto_reject_high_value";
    }

    if (amount > 50) {
        return "human_approval";
    }

    return "auto_approve";
}

// 5. Build the Graph
// ------------------
const workflow = new StateGraph({
    channels: {
        expenseDetails: { reducer: (x, y) => y ?? x, default: () => null },
        classification: { reducer: (x, y) => y ?? x, default: () => null },
        amountUsd: { reducer: (x, y) => y ?? x, default: () => 0 },
        riskScore: { reducer: (x, y) => y ?? x, default: () => 0 },
        logs: { reducer: (x, y) => x.concat(y), default: () => [] },
        status: { reducer: (x, y) => y ?? x, default: () => "PENDING" },
    }
});

// Add Nodes
workflow.addNode("initial_review", nodeInitialReview);
workflow.addNode("policy_check", nodePolicyCheck);
workflow.addNode("human_approval", nodeHumanApproval);
workflow.addNode("auto_approve", async (state) => ({ status: "APPROVED", logs: [...state.logs, "Auto-Approved (<$50)"] }));
workflow.addNode("auto_reject_high_value", async (state) => ({ status: "REJECTED", logs: [...state.logs, "Rejected (> $1000)"] }));
workflow.addNode("finalize", nodeFinalize);

// Add Edges
workflow.setEntryPoint("initial_review");
workflow.addEdge("initial_review", "policy_check");

// Conditional Edge from Policy Check
workflow.addConditionalEdges(
    "policy_check",
    routeAfterPolicy,
    {
        finalize: "finalize",
        human_approval: "human_approval",
        auto_approve: "auto_approve",
        auto_reject_high_value: "auto_reject_high_value"
    }
);

// Converge back to finalize
workflow.addEdge("human_approval", "finalize");
workflow.addEdge("auto_approve", "finalize");
workflow.addEdge("auto_reject_high_value", "finalize");
workflow.addEdge("finalize", END);

// 6. Compile & Run
// ----------------
const app = workflow.compile();

async function runDemo() {
    console.log("==========================================");
    console.log("SCENARIO 1: Simple Coffee (Auto Approve)");
    console.log("==========================================");
    await app.invoke({ expenseDetails: "I bought a Coffee for $4.50" });

    console.log("\n\n==========================================");
    console.log("SCENARIO 2: Team Dinner (Needs Approval)");
    console.log("==========================================");
    await app.invoke({ expenseDetails: "Team dinner at Steakhouse for $150.00" });

    console.log("\n\n==========================================");
    console.log("SCENARIO 3: New Laptop (High Value Reject)");
    console.log("==========================================");
    await app.invoke({ expenseDetails: "MacBook Pro for $2500.00" });

    console.log("\n\n==========================================");
    console.log("SCENARIO 4: Forbidden Item (Policy Reject)");
    console.log("==========================================");
    await app.invoke({ expenseDetails: "Beers on a Tuesday morning for $20" });
}

runDemo();
