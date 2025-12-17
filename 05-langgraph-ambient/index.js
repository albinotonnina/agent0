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
 * 
 * CONTINUOUS OPERATION:
 * - Configurable polling interval via POLL_INTERVAL_MS env var
 * - Graceful shutdown on SIGINT/SIGTERM
 * - Cycles through mock data or can be replaced with real data sources
 */

// CONFIGURATION
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS) || 5000; // Default: 5 seconds
const DEMO_MODE = process.env.DEMO_MODE !== 'false'; // Set to 'false' for infinite loop

// Graceful shutdown handling
let isShuttingDown = false;

function setupGracefulShutdown() {
    const shutdown = (signal) => {
        console.log(`\n[Ambient] Received ${signal}. Shutting down gracefully...`);
        isShuttingDown = true;
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
        console.error('[Ambient] Uncaught exception:', err);
        shutdown('uncaughtException');
    });
}

// MOCK DATA FEED
// In real life, this would be an RSS feed, WebSocket, or Database polling
const MOCK_NEWS_FEED = [
    { time: 1, content: "Bitcoin is stable at $60k", urgent: false },
    { time: 2, content: "New cat video trending on YouTube", urgent: false },
    { time: 3, content: "CRITICAL: Market crash! Bitcoin drops to $20k!", urgent: true },
    { time: 4, content: "Just kidding, it was a glitch.", urgent: false },
    { time: 5, content: "Ethereum upgrade completed successfully", urgent: false },
    { time: 6, content: "BREAKING: Major exchange hacked, funds at risk!", urgent: true },
    { time: 7, content: "New meme coin launches, up 1000%", urgent: false },
    { time: 8, content: "Fed announces interest rate decision", urgent: false },
];

let globalMethods = {
    // Simulating an external clock/event source
    tick: 0,
    fetchNews: () => {
        globalMethods.tick++;
        // In continuous mode, cycle through the feed
        const index = (globalMethods.tick - 1) % MOCK_NEWS_FEED.length;
        return MOCK_NEWS_FEED[index];
    },
    // Check if we should stop (demo mode ends after one cycle)
    shouldStop: () => {
        if (isShuttingDown) return true;
        if (DEMO_MODE && globalMethods.tick >= MOCK_NEWS_FEED.length) return true;
        return false;
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
    // Check for shutdown signal
    if (isShuttingDown) {
        console.log("[Ambient] Shutdown requested, stopping...");
        return { latestNews: null, shouldStop: true };
    }

    console.log(`\n[Ambient] Waking up to check feed... (Tick ${globalMethods.tick + 1})`);
    console.log(`  > Next check in ${POLL_INTERVAL_MS / 1000}s`);

    // Wait for the configured interval
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    // Check again after sleep (shutdown might have been requested)
    if (isShuttingDown) {
        return { latestNews: null, shouldStop: true };
    }

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

    try {
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
    } catch (error) {
        console.error("  > Error analyzing:", error.message);
        return { shouldAlert: false, analysis: `Error: ${error.message}` };
    }
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
    // Check for graceful shutdown or demo mode completion
    if (state.shouldStop || globalMethods.shouldStop()) {
        console.log("  > Agent stopping.");
        return END;
    }
    
    if (!state.latestNews) {
        // No news this tick, loop back to check again
        return "check_feed";
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
        shouldStop: { reducer: (x, y) => y ?? x, default: () => false },
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
        check_feed: "check_feed",
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
    setupGracefulShutdown();
    
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║           AMBIENT AGENT - Continuous Monitor               ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║  Poll Interval: ${(POLL_INTERVAL_MS / 1000).toString().padEnd(6)}seconds                          ║`);
    console.log(`║  Mode: ${DEMO_MODE ? 'DEMO (stops after one cycle)' : 'CONTINUOUS (runs forever)'}        ║`);
    console.log("║  Press Ctrl+C to stop gracefully                           ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");

    try {
        // Start the monitoring loop
        await app.invoke({});
        console.log("\n[Ambient] Agent stopped cleanly.");
    } catch (error) {
        if (!isShuttingDown) {
            console.error("[Ambient] Fatal error:", error);
            process.exit(1);
        }
    }
}

runDemo();
