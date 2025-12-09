// 05-langgraph-ambient/index.js

import { StateGraph, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 5: AMBIENT AGENT (Event-Driven / Background Loop)
 * 
 * SCENARIO: "Crypto/News Market Monitor"
 * 
 * Unlike a Chatbot (User initiates -> Agent responds), an Ambient Agent
 * runs in the background and only speaks when it decides something is interesting.
 * 
 * KEY CONCEPTS:
 * 1. Infinite Loop: The graph loops back to itself until a condition is met.
 * 2. "Sleep" State: Simulating persistence/waiting for the next tick.
 * 3. Proactive Output: The agent pushes information to the user.
 */

// MOCK DATA FEED
// In real life, this would be an RSS feed, WebSocket, or Database polling
const MOCK_NEWS_FEED = [
    { time: 1, content: "Bitcoin is stable at $60k", urgent: false },
    { time: 2, content: "New cat video trending on YouTube", urgent: false },
    { time: 3, content: "CRITICAL: Market crash! Bitcoin drops to $20k!", urgent: true },
    { time: 4, content: "Just kidding, it was a glitch.", urgent: false },
];

let globalMethods = {
    // Simulating an external clock/event source
    tick: 0,
    fetchNews: () => {
        globalMethods.tick++;
        return MOCK_NEWS_FEED[globalMethods.tick - 1] || null;
    }
};

// 1. Define State
// ---------------
const AgentState = {
    lastCheckedId: 0,
    latestNews: null,
    analysis: null,
    shouldAlert: false,
};

// 2. Setup Model
// --------------
const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// 3. Define Nodes
// ---------------

async function nodeCheckFeed(state) {
    console.log(`\n[Ambient] Waking up to check feed... (Tick ${globalMethods.tick + 1})`);

    // Simulate wait
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newsItem = globalMethods.fetchNews();

    if (!newsItem) {
        console.log("  > No new data.");
        return { latestNews: null };
    }

    console.log(`  > Found item: "${newsItem.content}"`);
    return { latestNews: newsItem };
}

async function nodeAnalyzeImportance(state) {
    if (!state.latestNews) return { shouldAlert: false };

    console.log("  > Analyzing importance...");

    // Ask the AI if this is worth interrupting the user for
    const response = await model.invoke([
        ["system", "You are a personal executive assistant. Decide if a news item is URGENT enough to interrupt the boss. Return 'URGENT' or 'IGNORE'."],
        ["user", `News: ${state.latestNews.content}`]
    ]);

    const isUrgent = response.content.includes("URGENT");

    return {
        shouldAlert: isUrgent,
        analysis: response.content
    };
}

async function nodeAlertUser(state) {
    console.log("\n!!! INTERRUPT: IMPORTANT MESSAGE !!!");
    console.log(`AGENT: "Boss, I found something you need to see: ${state.latestNews.content}"`);
    console.log("!!! END INTERRUPT !!!\n");

    return {};
}

// 4. Define Routing
// -----------------
// Decide whether to loop back to sleep or alert the user

function routeAfterAnalysis(state) {
    if (state.shouldAlert) {
        return "alert_user";
    }
    return "check_feed"; // Loop back to start (In real app, you'd wait before looping)
}

function routeFeedCheck(state) {
    if (!state.latestNews) {
        // If we ran out of data, end the demo. 
        // In a real ambient agent, this would be a 'sleep' node that waits 5 minutes.
        console.log("  > Feed is empty. Demo ending.");
        return END;
    }
    return "analyze_importance";
}

// 5. Build Graph
// --------------
const workflow = new StateGraph({
    channels: {
        lastCheckedId: { reducer: (x, y) => y ?? x, default: () => 0 },
        latestNews: { reducer: (x, y) => y ?? x, default: () => null },
        analysis: { reducer: (x, y) => y ?? x, default: () => null },
        shouldAlert: { reducer: (x, y) => y ?? x, default: () => false },
    }
});

workflow.addNode("check_feed", nodeCheckFeed);
workflow.addNode("analyze_importance", nodeAnalyzeImportance);
workflow.addNode("alert_user", nodeAlertUser);

workflow.setEntryPoint("check_feed");

workflow.addConditionalEdges(
    "check_feed",
    routeFeedCheck,
    {
        analyze_importance: "analyze_importance",
        [END]: END
    }
);

workflow.addConditionalEdges(
    "analyze_importance",
    routeAfterAnalysis,
    {
        alert_user: "alert_user",
        check_feed: "check_feed"
    }
);

workflow.addEdge("alert_user", "check_feed"); // Go back to monitoring after alerting

// 6. Run
// ------
const app = workflow.compile();

async function runDemo() {
    console.log("Starting Ambient Agent...");
    console.log("(Press Ctrl+C to stop if it runs forever, but this demo has a limited feed)");

    // Start the infinite loop
    await app.invoke({});
}

runDemo();
