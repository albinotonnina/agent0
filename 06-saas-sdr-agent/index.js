// 06-saas-sdr-agent/index.js

import { StateGraph, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 6: THE COMMERCIAL SAAS AGENT ("AutoSDR")
 * 
 * SCENARIO: A monetizable B2B Tool.
 * "Input a company URL -> Get a personalized cold email for the CEO."
 * 
 * COMMERCIAL FEATURES:
 * 1. Credit System: Checks if user has balance. Deducts credits.
 * 2. Specialized Pipeline: Scrape -> Analyze -> Draft.
 * 3. Structured Deliverable: Returns JSON, not chat.
 */

// 1. Mock Database / User System
// ------------------------------
const MOCK_DB = {
    users: {
        "user_123": { credits: 10, plan: "PRO" }, // Needs 5 credits per run
        "user_456": { credits: 2, plan: "FREE" },  // Too poor to run this
    }
};

const COST_PER_RUN = 5;

// 2. State Definition
// -------------------
const AgentState = {
    // Input
    userId: null,
    targetUrl: null,

    // Pipeline Data
    companyInfo: null,
    decisionMaker: null,
    emailDraft: null,

    // Error/Status
    error: null,
};

// 3. Setup Model
// --------------
const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// 4. Nodes (The "Business Logic")
// -------------------------------

// A. Billing Check (The Gatekeeper)
async function nodeBillingCheck(state) {
    console.log(`\n[System] Checking billing for ${state.userId}...`);
    const user = MOCK_DB.users[state.userId];

    if (!user) return { error: "User not found" };

    if (user.credits < COST_PER_RUN) {
        return { error: `Insufficient credits. You have ${user.credits}, need ${COST_PER_RUN}. Please Upgrade.` };
    }

    // Deduct credits
    user.credits -= COST_PER_RUN;
    console.log(`  > Deducted ${COST_PER_RUN} credits. Remaining: ${user.credits}`);
    return {}; // Success, continue
}

// B. "Scraper" (Mocked)
async function nodeScrapeCompany(state) {
    console.log(`\n[Agent] Scraping ${state.targetUrl}...`);
    // Mocking what a tool like Firecrawl/Puppeteer would return
    const mockContent = `
    Welcome to ${state.targetUrl.replace('https://', '').replace('.com', '')} AI! 
    We build autonomous widgets for enterprise logistics.
    Our mission is to optimize supply chains by 50%.
    Lead by CEO Jane Doe, who loves sailing and efficiency.
  `;
    return { companyInfo: mockContent };
}

// C. Decision Maker Identification
async function nodeIdentifyProspect(state) {
    console.log(`\n[Agent] Identifying Decision Maker...`);

    const response = await model.invoke([
        ["system", "Extract the CEO name and a personalized 'hook' based on their interests."],
        ["user", state.companyInfo]
    ]);

    return { decisionMaker: response.content };
}

// D. Email Drafter
async function nodeDraftEmail(state) {
    console.log(`\n[Agent] Drafting High-Conversion Email...`);

    const response = await model.invoke([
        ["system", "Write a short, punchy cold email selling 'Agent0 Sales Tool'. Use the hook."],
        ["user", `Prospect Info: ${state.decisionMaker}. Company context: ${state.companyInfo}`]
    ]);

    return { emailDraft: response.content };
}

// 5. Routing
// ----------
function routeBilling(state) {
    if (state.error) return "finalize_error";
    return "scrape_company";
}

// 6. Build Graph
// --------------
const workflow = new StateGraph({
    channels: {
        userId: { reducer: (x, y) => y ?? x, default: () => null },
        targetUrl: { reducer: (x, y) => y ?? x, default: () => null },
        companyInfo: { reducer: (x, y) => y ?? x, default: () => null },
        decisionMaker: { reducer: (x, y) => y ?? x, default: () => null },
        emailDraft: { reducer: (x, y) => y ?? x, default: () => null },
        error: { reducer: (x, y) => y ?? x, default: () => null },
    }
});

workflow.addNode("billing_check", nodeBillingCheck);
workflow.addNode("scrape_company", nodeScrapeCompany);
workflow.addNode("identify_prospect", nodeIdentifyProspect);
workflow.addNode("draft_email", nodeDraftEmail);
workflow.addNode("finalize_error", async (state) => console.log(`\n[Error] ${state.error}`));

workflow.setEntryPoint("billing_check");

workflow.addConditionalEdges(
    "billing_check",
    routeBilling,
    {
        finalize_error: "finalize_error",
        scrape_company: "scrape_company"
    }
);

workflow.addEdge("scrape_company", "identify_prospect");
workflow.addEdge("identify_prospect", "draft_email");
workflow.addEdge("draft_email", END);
workflow.addEdge("finalize_error", END);

// 7. Run Commercial Simulation
// ----------------------------
const app = workflow.compile();

async function runDemo() {
    console.log("=== RUN 1: Wealthy User (Success) ===");
    const result1 = await app.invoke({
        userId: "user_123",
        targetUrl: "https://logistics-widgets.com"
    });

    if (result1.emailDraft) {
        console.log("\n>>> DELIVERABLE (Ready to Send) <<<");
        console.log(result1.emailDraft);
    }

    console.log("\n\n=== RUN 2: Poor User (Upsell Trigger) ===");
    await app.invoke({
        userId: "user_456",
        targetUrl: "https://another-startup.com"
    });
}

runDemo();
